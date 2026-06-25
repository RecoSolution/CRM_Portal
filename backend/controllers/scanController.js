import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';
import Contact from '../models/Contact.js';

/*
async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  const data = await res.json();
  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

async function callGeminiWithRetry(prompt, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGemini(prompt);
    } catch (err) {
      lastError = err;
      const msg = err.message.toLowerCase();
      const isRetryable = msg.includes('high demand') || msg.includes('overloaded') || msg.includes('503') || msg.includes('429') || msg.includes('quota');
      if (!isRetryable || attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}

function classifyGeminiError(rawMessage) {
  const msg = rawMessage || '';
  const lower = msg.toLowerCase();
  if (lower.includes('quota') || msg.includes('429') || lower.includes('too many requests')) {
    return 'AI service rate limit reached on our end. Please wait about a minute and tap Retry AI Extraction.';
  }
  if (lower.includes('high demand') || msg.includes('503') || lower.includes('overloaded')) {
    return "AI service is temporarily overloaded on Google's side (not your account). Please wait a few minutes and tap Retry AI Extraction.";
  }
  return `AI extraction failed: ${msg}`;
}

function buildExtractionPrompt(rawText) {
  return `Extract contact information from this business card text...`;
}

function parseAIJson(text, fallback = {}) {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return fallback;
  }
}

async function extractContactFromText(rawText) {
  let extractedContact = { name: '', company: '', designation: '', email: '', phone: '', website: '', address: '' };
  let aiError = null;
  try {
    const aiText = await callGeminiWithRetry(buildExtractionPrompt(rawText));
    extractedContact = parseAIJson(aiText, extractedContact);
  } catch (err) {
    aiError = classifyGeminiError(err.message);
    extractedContact = { ...extractedContact, ...regexExtractBasicFields(rawText) };
  }
  return { extractedContact, aiError };
}
*/

// ════════════════════════════════════════════════════════
// ACTIVE: OCR.space (free, no card required)
// ════════════════════════════════════════════════════════

async function recognizeWithOcrSpace(base64Image, mimetype) {
  const formData = new URLSearchParams();
  formData.append('apikey', process.env.OCRSPACE_API_KEY);
  formData.append('base64Image', `data:${mimetype};base64,${base64Image}`);
  formData.append('language', 'eng');
  formData.append('OCREngine', '2');
  formData.append('scale', 'true');
  formData.append('detectOrientation', 'true');

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  const data = await res.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(`OCR.space error: ${data.ErrorMessage?.join(', ') || 'Unknown error'}`);
  }

  const text = data.ParsedResults?.[0]?.ParsedText?.trim() || '';
  return { text };
}

// ════════════════════════════════════════════════════════
// Pattern-matching extraction (no AI)
// ════════════════════════════════════════════════════════

const TITLE_KEYWORDS = [
  'ceo', 'cfo', 'cto', 'coo', 'founder', 'co-founder', 'cofounder', 'director',
  'manager', 'president', 'vice president', 'vp', 'executive', 'head', 'owner',
  'partner', 'consultant', 'engineer', 'designer', 'analyst', 'specialist',
  'lead', 'supervisor', 'coordinator', 'officer', 'administrator', 'proprietor',
  'chairman', 'chairperson', 'principal', 'associate', 'sales', 'marketing',
  'operations', 'finance', 'hr', 'human resources', 'business development',
];

const NAME_HINTS = [
  'mr', 'mrs', 'ms', 'dr', 'prof', 'shri', 'smt',
  'patel', 'shah', 'desai', 'mehta', 'gandhi', 'sharma', 'verma', 'gupta',
  'singh', 'kumar', 'reddy', 'nair', 'iyer', 'rao', 'joshi', 'agarwal',
  'jain', 'bhatt', 'trivedi', 'pandey', 'mishra', 'chawla', 'malhotra',
  'kapoor', 'khanna', 'chopra', 'bose', 'banerjee', 'mukherjee', 'das',
  'pillai', 'menon', 'naidu', 'rajan', 'kulkarni', 'deshmukh', 'jadhav',
  'thakur', 'yadav', 'chauhan', 'rathore', 'bhatia', 'arora', 'sethi',
  'goel', 'goyal', 'mittal', 'bansal', 'saxena', 'tiwari', 'dubey',
];

// Common consumer email providers - never treat these as a "website"
const COMMON_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'rediffmail.com', 'icloud.com', 'live.com', 'aol.com',
];

// Company name suffixes / keywords - helps detect company lines without AI
const COMPANY_SUFFIXES = [
  'pvt', 'ltd', 'llp', 'inc', 'corp', 'co.', 'company',
  'enterprises', 'industries', 'solutions', 'group', 'international',
];

function looksLikeName(line) {
  const words = line.trim().split(/\s+/);
  const wordCount = words.length;
  const hasDigits = /\d/.test(line);
  const hasSymbols = /[@/\\#*_~`|<>{}[\]]/.test(line);
  const isReasonableLength = line.length >= 4 && line.length < 45;

  if (hasDigits || hasSymbols || !isReasonableLength) return false;
  if (wordCount < 2 || wordCount > 4) return false;
  return true;
}

// Extracts email/phone/website using fixed patterns.
// Website search excludes the matched email AND known consumer email
// domains, so "gmail.com" can never be picked up as a website by mistake.
function regexExtractBasicFields(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const textWithoutEmail = email ? text.replace(email, '') : text;

  const phoneMatch = text.match(/(\+?\d[\d\s-]{8,}\d)/);

  const websiteMatches = textWithoutEmail.match(/\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|in|net|org|co)\b/gi) || [];
  const validWebsite = websiteMatches.find(
    (w) => !COMMON_EMAIL_DOMAINS.includes(w.toLowerCase()),
  );

  return {
    email,
    phone: phoneMatch ? phoneMatch[0].trim() : '',
    website: validWebsite || '',
  };
}

// Guesses a company name using two heuristics:
// 1. A line containing a company suffix (Pvt Ltd, LLP, Inc, etc.)
// 2. An ALL-CAPS line (often the logo/brand text in OCR output) that
//    isn't the designation line itself
function guessCompany(lines, designationIndex) {
  const suffixLine = lines.find((l) =>
    COMPANY_SUFFIXES.some((suffix) => l.toLowerCase().includes(suffix)),
  );
  if (suffixLine) return suffixLine;

  const allCapsLine = lines.find((l, i) => {
    const isAllCaps = l === l.toUpperCase() && /[A-Z]/.test(l);
    const isLongEnough = l.length > 3 && l.length < 40;
    return isAllCaps && isLongEnough && i !== designationIndex;
  });

  return allCapsLine || '';
}

function heuristicExtract(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  let name = '';
  let designation = '';
  let address = '';

  let designationIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (TITLE_KEYWORDS.some((kw) => lower.includes(kw))) {
      designation = lines[i];
      designationIndex = i;
      break;
    }
  }

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

  const pinCodeLine = lines.find((l) => /\b\d{5,6}\b/.test(l) && /,/.test(l));
  if (pinCodeLine) {
    address = pinCodeLine;
  } else {
    const commaLines = lines.filter((l) => (l.match(/,/g) || []).length >= 2);
    if (commaLines.length > 0) {
      address = commaLines.sort((a, b) => b.length - a.length)[0];
    }
  }

  const company = guessCompany(lines, designationIndex);

  return { name, designation, address, company };
}

function extractContactFields(rawText) {
  const basics = regexExtractBasicFields(rawText);
  const heuristics = heuristicExtract(rawText);

  return {
    name: heuristics.name,
    designation: heuristics.designation,
    address: heuristics.address,
    company: heuristics.company,
    email: basics.email,
    phone: basics.phone,
    website: basics.website,
  };
}

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ocr
// @desc    Upload card image → OCR.space → pattern-match extraction
// @access  Private
// ────────────────────────────────────────────────────────
const scanCard = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an image.' });
  }

  const base64Image = req.file.buffer.toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: 'recosolution/cards',
  });
  const imageUrl = uploadResult.secure_url;

  let rawText = '';
  try {
    const result = await recognizeWithOcrSpace(base64Image, req.file.mimetype);
    rawText = result.text;
  } catch (err) {
    console.error('OCR.space failed:', err.message);
    return res.status(502).json({
      success: false,
      message: 'OCR service is temporarily unavailable. Please try again in a moment.',
    });
  }

  if (!rawText) {
    return res.status(400).json({
      success: false,
      message: 'Could not read text from card. Please retake a clearer photo.',
    });
  }

  const extractedContact = extractContactFields(rawText);

  res.json({
    success: true,
    rawText,
    extractedContact,
    cardImageUrl: imageUrl,
    aiError: null,
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ai-summary
// @desc    DISABLED (AI-based) - returns existing/safe values
// @access  Private
// ────────────────────────────────────────────────────────
const generateAISummary = asyncHandler(async (req, res) => {
  const { contactId } = req.body;

  const contact = await Contact.findOne({ _id: contactId, owner: req.user.id });

  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  res.json({
    success: true,
    summary: contact.aiSummary || '',
    leadScore: contact.leadScore || 0,
    leadCategory: contact.leadCategory || 'cold',
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/upload-voice
// @access  Private
// ────────────────────────────────────────────────────────
const uploadVoiceNote = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No audio file provided.' });
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
// @access  Private
// ────────────────────────────────────────────────────────
const retryExtraction = asyncHandler(async (req, res) => {
  const { rawText } = req.body;

  if (!rawText) {
    return res.status(400).json({ success: false, message: 'No raw text provided.' });
  }

  const extractedContact = extractContactFields(rawText);

  res.json({ success: true, extractedContact, aiError: null });
});

export { scanCard, generateAISummary, uploadVoiceNote, retryExtraction };