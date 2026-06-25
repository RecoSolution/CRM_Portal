import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';
import Contact from '../models/Contact.js';

// ════════════════════════════════════════════════════════
// AI CODE (Gemini) - COMMENTED OUT, kept for future re-enable
// ════════════════════════════════════════════════════════

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
  return `Extract contact information from this business card text...`; // (original prompt)
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
// ACTIVE: Google Cloud Vision OCR (replaces Tesseract)
// ════════════════════════════════════════════════════════

// Calls Google Cloud Vision's TEXT_DETECTION endpoint.
// Vision handles rotation, skew, and low-quality images internally -
// no manual rotation loop or image preprocessing needed anymore.
async function recognizeWithVision(base64Image) {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    },
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(`Google Vision error: ${data.error.message}`);
  }

  const annotation = data.responses?.[0]?.fullTextAnnotation;
  const text = annotation?.text?.trim() || '';

  return { text };
}

// ════════════════════════════════════════════════════════
// Pattern-matching extraction (no AI) - unchanged from before,
// now operating on much cleaner Vision OCR output instead of Tesseract's.
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

function regexExtractBasicFields(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const textWithoutEmail = email ? text.replace(email, '') : text;

  const phoneMatch = text.match(/(\+?\d[\d\s-]{8,}\d)/);
  const websiteMatch = textWithoutEmail.match(/\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|in|net|org|co)\b/i);

  return {
    email,
    phone: phoneMatch ? phoneMatch[0].trim() : '',
    website: websiteMatch ? websiteMatch[0] : '',
  };
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

  return { name, designation, address };
}

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

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ocr
// @desc    Upload card image → Google Vision OCR → pattern-match extraction
// @access  Private
// ────────────────────────────────────────────────────────
const scanCard = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an image.' });
  }

  // ── Step 1: Upload image to Cloudinary ──────────────
  const base64Image = req.file.buffer.toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: 'recosolution/cards',
  });
  const imageUrl = uploadResult.secure_url;

  // ── Step 2: Run OCR using Google Cloud Vision (handles rotation/quality internally) ──
  let rawText = '';
  try {
    const result = await recognizeWithVision(base64Image);
    rawText = result.text;
  } catch (err) {
    console.error('Google Vision OCR failed:', err.message);
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

  // ── Step 3: Extract fields using pattern-matching (no AI) ──
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
// @desc    Re-runs pattern-match extraction on already-scanned raw text
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