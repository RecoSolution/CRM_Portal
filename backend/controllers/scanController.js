import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';
import Contact from '../models/Contact.js';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

// Common job title / designation keywords
const TITLE_KEYWORDS = [
  'ceo',
  'cfo',
  'cto',
  'coo',
  'founder',
  'co-founder',
  'cofounder',
  'director',
  'manager',
  'president',
  'vice president',
  'vp',
  'executive',
  'head',
  'owner',
  'partner',
  'consultant',
  'engineer',
  'designer',
  'analyst',
  'specialist',
  'lead',
  'supervisor',
  'coordinator',
  'officer',
  'administrator',
  'proprietor',
  'chairman',
  'chairperson',
  'principal',
  'associate',
  'sales',
  'marketing',
  'operations',
  'finance',
  'hr',
  'human resources',
  'business development',
];

// Common Indian/international surnames and name-prefixes/suffixes,
// used to help confirm a line is a person's name (not a company/tagline).
const NAME_HINTS = [
  // Common honorifics/prefixes
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'shri',
  'smt',
  // Common surnames (expand this list anytime - more entries = better detection)
  'patel',
  'shah',
  'desai',
  'mehta',
  'gandhi',
  'sharma',
  'verma',
  'gupta',
  'singh',
  'kumar',
  'reddy',
  'nair',
  'iyer',
  'rao',
  'joshi',
  'agarwal',
  'jain',
  'bhatt',
  'trivedi',
  'pandey',
  'mishra',
  'chawla',
  'malhotra',
  'kapoor',
  'khanna',
  'chopra',
  'bose',
  'banerjee',
  'mukherjee',
  'das',
  'pillai',
  'menon',
  'naidu',
  'rajan',
  'kulkarni',
  'deshmukh',
  'jadhav',
  'thakur',
  'yadav',
  'chauhan',
  'rathore',
  'bhatia',
  'arora',
  'sethi',
  'goel',
  'goyal',
  'mittal',
  'bansal',
  'saxena',
  'tiwari',
  'dubey',
];

// Helper: does this line look like a person's name?
// (2-4 words, mostly letters, no digits/symbols, reasonably short,
// optionally matches a known surname/honorific for extra confidence)
function looksLikeName(line) {
  const words = line.trim().split(/\s+/);
  const wordCount = words.length;
  const hasDigits = /\d/.test(line);
  const hasSymbols = /[@/\\#*_~`|<>{}[\]]/.test(line);
  const isReasonableLength = line.length >= 4 && line.length < 45;

  if (hasDigits || hasSymbols || !isReasonableLength) return false;
  if (wordCount < 2 || wordCount > 4) return false;

  // Bonus confidence check (not required, just helps when ambiguous)
  const lower = line.toLowerCase();
  const matchesNameHint = NAME_HINTS.some((hint) => lower.includes(hint));

  return true || matchesNameHint; // structural check is enough; hint is a bonus signal only
}

// Helper: regex-based extraction for email, phone, website -
// these have fixed, reliable patterns, so they stay accurate
// regardless of card layout or font style.
function regexExtractBasicFields(text) {
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  );
  const email = emailMatch ? emailMatch[0] : '';

  // Remove the matched email from the text before searching for a website,
  // so the website regex doesn't accidentally match the domain inside the email
  const textWithoutEmail = email ? text.replace(email, '') : text;

  const phoneMatch = text.match(/(\+?\d[\d\s-]{8,}\d)/);
  const websiteMatch = textWithoutEmail.match(
    /\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|in|net|org|co)\b/i,
  );

  return {
    email,
    phone: phoneMatch ? phoneMatch[0].trim() : '',
    website: websiteMatch ? websiteMatch[0] : '',
  };
}

// Helper: heuristic extraction for name, designation, address -
// uses line position and keyword/pattern matching. No AI involved.
function heuristicExtract(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  let name = '';
  let designation = '';
  let address = '';

  // ── Designation: first line containing a known title keyword ──
  let designationIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (TITLE_KEYWORDS.some((kw) => lower.includes(kw))) {
      designation = lines[i];
      designationIndex = i;
      break;
    }
  }

  // ── Name: prefer the line right before designation if it looks like a name,
  //    otherwise scan all lines for the first name-like candidate,
  //    preferring ones that match a known surname/honorific ──
  let nameCandidate = '';

  if (designationIndex > 0 && looksLikeName(lines[designationIndex - 1])) {
    nameCandidate = lines[designationIndex - 1];
  } else {
    const candidates = lines.filter((l) => looksLikeName(l));
    const withSurnameHint = candidates.find((l) =>
      NAME_HINTS.some((hint) => l.toLowerCase().includes(hint)),
    );
    nameCandidate = withSurnameHint || candidates[0] || '';
  }

  name = nameCandidate;

  // ── Address: line with a PIN/ZIP code + comma, or longest comma-heavy line ──
  const pinCodeLine = lines.find((l) => /\b\d{5,6}\b/.test(l) && /,/.test(l));
  if (pinCodeLine) {
    address = pinCodeLine;
  } else {
    const commaLines = lines.filter((l) => (l.match(/,/g) || []).length >= 2);
    if (commaLines.length > 0) {
      address = commaLines.sort((a, b) => b.length - a.length)[0];
    }
  }

  return { name, designation, address };
}

// Combines regex (email/phone/website) + heuristics (name/designation/address)
// into the full contact shape the frontend expects. Company is intentionally
// left blank - no reliable text pattern exists for "this is a company name"
// without understanding context, so it's always filled in manually.
function extractContactFields(rawText) {
  const basics = regexExtractBasicFields(rawText);
  const heuristics = heuristicExtract(rawText);

  return {
    name: heuristics.name,
    designation: heuristics.designation,
    address: heuristics.address,
    company: '',
    email: basics.email,
    phone: basics.phone,
    website: basics.website,
  };
}

// Helper: preprocess image to improve OCR accuracy
// (grayscale + contrast boost + sharpen - helps with stylized fonts,
// background textures, and low-quality photos)
async function preprocessForOCR(buffer) {
  return sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: false })
    .greyscale()
    .normalize()
    .sharpen()
    .toBuffer();
}

async function recognizeWithRotation(buffer) {
  const preprocessed = await preprocessForOCR(buffer);

  // Try the straight orientation first - this is correct most of the time
  const straightResult = await Tesseract.recognize(preprocessed, 'eng');
  const straightText = straightResult.data.text.trim();
  const straightConfidence = straightResult.data.confidence;

  // If the result looks reasonably good, stop here - don't waste time
  // trying other rotations. "Good enough" = some real text with decent confidence.
  const looksGoodEnough = straightText.length > 15 && straightConfidence > 40;

  if (looksGoodEnough) {
    return { text: straightText, confidence: straightConfidence, angle: 0 };
  }

  // Otherwise, the card might be rotated - try the other 3 angles
  let best = { text: straightText, confidence: straightConfidence, angle: 0 };

  for (const angle of [90, 180, 270]) {
    const rotatedBuffer = await sharp(preprocessed).rotate(angle).toBuffer();
    const result = await Tesseract.recognize(rotatedBuffer, 'eng');
    const confidence = result.data.confidence;
    const text = result.data.text.trim();

    if (
      confidence > best.confidence ||
      (confidence === best.confidence && text.length > best.text.length)
    ) {
      best = { text, confidence, angle };
    }
  }

  return best;
}

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ocr
// @desc    Upload card image → Tesseract OCR → pattern-match extraction (no AI)
// @access  Private
// ────────────────────────────────────────────────────────
const scanCard = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'Please upload an image.' });
  }

  // ── Step 1: Upload image to Cloudinary ──────────────
  const base64Image = req.file.buffer.toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: 'recosolution/cards',
  });
  const imageUrl = uploadResult.secure_url;

  // ── Step 2: Run OCR using Tesseract.js, trying multiple rotations ──
  const best = await recognizeWithRotation(req.file.buffer);
  const rawText = best.text;

  if (!rawText) {
    return res.status(400).json({
      success: false,
      message: 'Could not read text from card. Please retake a clearer photo.',
    });
  }

  // ── Step 3: Extract fields using pattern-matching (NO AI, NO API calls) ──
  const extractedContact = extractContactFields(rawText);

  res.json({
    success: true,
    rawText,
    extractedContact,
    cardImageUrl: imageUrl,
    aiError: null, // no AI is used, so this is always null now
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ai-summary
// @desc    DISABLED - was Gemini-based lead summary/scoring.
//          Returns safe defaults so existing frontend calls don't break.
// @access  Private
// ────────────────────────────────────────────────────────
const generateAISummary = asyncHandler(async (req, res) => {
  const { contactId } = req.body;

  const contact = await Contact.findOne({ _id: contactId, owner: req.user.id });

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  // AI summary disabled - leave existing values untouched, just confirm success
  res.json({
    success: true,
    summary: contact.aiSummary || '',
    leadScore: contact.leadScore || 0,
    leadCategory: contact.leadCategory || 'cold',
  });

  /* ── Original AI-based version (commented out) ──
  const prompt = `You are a sales assistant for RecoSolution...`;
  const aiText = await callGeminiWithRetry(prompt);
  const result = parseAIJson(aiText, { summary: '', leadScore: 0, leadCategory: 'cold' });
  contact.aiSummary = result.summary;
  contact.leadScore = result.leadScore;
  contact.leadCategory = result.leadCategory;
  await contact.save();
  res.json({ success: true, ...result });
  */
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/upload-voice
// @desc    Upload a recorded voice note audio file to Cloudinary
// @access  Private
// ────────────────────────────────────────────────────────
const uploadVoiceNote = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'No audio file provided.' });
  }

  const base64Audio = req.file.buffer.toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${base64Audio}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: 'recosolution/voice-notes',
    resource_type: 'video',
  });

  res.json({ success: true, audioUrl: uploadResult.secure_url });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/retry-extraction
// @desc    Re-runs pattern-match extraction on already-scanned raw text.
//          No longer needed for AI retries, but kept so the frontend's
//          existing "Retry" button still works (re-runs heuristics,
//          useful if extraction logic improves and user wants a re-try).
// @access  Private
// ────────────────────────────────────────────────────────
const retryExtraction = asyncHandler(async (req, res) => {
  const { rawText } = req.body;

  if (!rawText) {
    return res
      .status(400)
      .json({ success: false, message: 'No raw text provided.' });
  }

  const extractedContact = extractContactFields(rawText);

  res.json({ success: true, extractedContact, aiError: null });
});

export { scanCard, generateAISummary, uploadVoiceNote, retryExtraction };
