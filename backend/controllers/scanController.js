import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';
import Contact from '../models/Contact.js';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

// ────────────────────────────────────────────────────────
// Helper: Call Gemini API
// ────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return text;
}

// Helper: Parse JSON safely from AI response (strips ```json fences)
function parseAIJson(text, fallback = {}) {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

// Helper: regex-based extraction as a backup when AI is unavailable.
// Catches easy, pattern-based fields without needing any AI call -
// these stay accurate even during a Gemini outage or quota limit.
function regexExtract(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d[\d\s-]{8,}\d)/);
  const websiteMatch = text.match(/\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|in|net|org|co)\b/i);

  return {
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0].trim() : '',
    website: websiteMatch ? websiteMatch[0] : '',
  };
}

// Helper: turn raw Gemini error messages into clear, actionable text,
// distinguishing "your quota" (wait ~60s) from "Google's servers overloaded"
// (wait a few minutes) - these need different guidance for the user.
function classifyGeminiError(rawMessage) {
  const msg = rawMessage || '';

  if (msg.includes('quota') || msg.includes('429') || msg.toLowerCase().includes('too many requests')) {
    return 'AI service rate limit reached on our end. Please wait about a minute and tap Retry AI Extraction.';
  }

  if (msg.toLowerCase().includes('high demand') || msg.includes('503') || msg.toLowerCase().includes('overloaded')) {
    return 'AI service is temporarily overloaded on Google\'s side (not your account). Please wait a few minutes and tap Retry AI Extraction.';
  }

  return `AI extraction failed: ${msg}`;
}

// Helper: preprocess image to improve OCR accuracy
// (grayscale + contrast boost + sharpen - helps with stylized fonts,
// background textures, and low-quality photos)
async function preprocessForOCR(buffer) {
  return sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: false }) // upscale small images
    .greyscale()
    .normalize() // auto contrast stretch
    .sharpen()
    .toBuffer();
}

async function recognizeWithRotation(buffer) {
  const rotations = [0, 90, 180, 270];
  let best = { text: '', confidence: 0 };

  // Preprocess once - rotation happens on the cleaned-up version
  const preprocessed = await preprocessForOCR(buffer);

  for (const angle of rotations) {
    const rotatedBuffer =
      angle === 0 ? preprocessed : await sharp(preprocessed).rotate(angle).toBuffer();

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
// @desc    Upload card image → Tesseract OCR → Gemini extracts fields
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

  // ── Step 3: Send raw text to Gemini to extract structured fields ──
  // If Gemini fails (overloaded, rate limited, etc), fall back to
  // regex-based extraction for phone/email/website, and surface a
  // clear, classified error to the frontend instead of silently
  // leaving everything blank.
  let extractedContact = {
    name: '',
    company: '',
    designation: '',
    email: '',
    phone: '',
    website: '',
    address: '',
  };
  let aiError = null;

  try {
    const prompt = `Extract contact information from this business card text and return ONLY a JSON object with these exact fields: name, company, designation, email, phone, website, address.

RULES:
- Phone numbers and email addresses: extract them whenever a digit sequence (10+ digits) or email pattern (text@text.text) appears, even if surrounded by noise. These are low-risk to extract - prefer extracting over leaving blank.
- Name, company, designation: only extract if clearly and explicitly labeled or obviously a person's name / business name. If text is handwritten, scribbled, or ambiguous, use empty string "" rather than guessing.
- A line in ALL CAPS describing what a business does (e.g. "WOOD PRESSED OIL MANUFACTURER") is the designation/tagline, not a separate company name.
- The large stylized brand/logo text (e.g. company name with a TM or registered trademark symbol) is the company name - use that for "company", not the tagline.
- If no person's name appears anywhere on the card, leave "name" as empty string - do not use the company name as a substitute.

Business card text:
${rawText}

Return only the JSON object, no explanation, no markdown formatting.`;

    const aiText = await callGemini(prompt);
    extractedContact = parseAIJson(aiText, extractedContact);
  } catch (err) {
    console.error('Gemini extraction failed, using regex fallback:', err.message);
    aiError = classifyGeminiError(err.message);
    const fallback = regexExtract(rawText);
    extractedContact = { ...extractedContact, ...fallback };
  }

  res.json({
    success: true,
    rawText,
    extractedContact,
    cardImageUrl: imageUrl,
    aiError, // null if Gemini worked, friendly message string if it failed
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ai-summary
// @desc    Generate AI summary + lead score for a contact (Gemini)
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

  const prompt = `You are a sales assistant for RecoSolution, a plastic recycling machinery company.
Write a 2-3 sentence summary for this contact and give a lead score out of 100.
Return ONLY a JSON object: { "summary": "...", "leadScore": 75, "leadCategory": "hot" }
leadCategory must be exactly one of: "hot", "warm", "cold".

Contact:
Name: ${contact.name}
Company: ${contact.company}
Designation: ${contact.designation}
Event: ${contact.event}
Notes: ${contact.notes.map((n) => n.content).join('. ')}

Return only the JSON object, no explanation, no markdown formatting.`;

  const aiText = await callGemini(prompt);
  const result = parseAIJson(aiText, {
    summary: '',
    leadScore: 0,
    leadCategory: 'cold',
  });

  // Save to contact
  contact.aiSummary = result.summary;
  contact.leadScore = result.leadScore;
  contact.leadCategory = result.leadCategory;
  await contact.save();

  res.json({ success: true, ...result });
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
    resource_type: 'video', // Cloudinary stores audio under "video" resource type
  });

  res.json({ success: true, audioUrl: uploadResult.secure_url });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/retry-extraction
// @desc    Re-run AI extraction on already-scanned raw text
//          (used when the first attempt failed due to quota/rate limits)
// @access  Private
// ────────────────────────────────────────────────────────
const retryExtraction = asyncHandler(async (req, res) => {
  const { rawText } = req.body;

  if (!rawText) {
    return res.status(400).json({ success: false, message: 'No raw text provided.' });
  }

  let extractedContact = {
    name: '', company: '', designation: '', email: '', phone: '', website: '', address: '',
  };
  let aiError = null;

  try {
    const prompt = `Extract contact information from this business card text and return ONLY a JSON object with these exact fields: name, company, designation, email, phone, website, address.

RULES:
- Phone numbers and email addresses: extract them whenever a digit sequence (10+ digits) or email pattern (text@text.text) appears, even if surrounded by noise. These are low-risk to extract - prefer extracting over leaving blank.
- Name, company, designation: only extract if clearly and explicitly labeled or obviously a person's name / business name. If text is handwritten, scribbled, or ambiguous, use empty string "" rather than guessing.
- A line in ALL CAPS describing what a business does (e.g. "WOOD PRESSED OIL MANUFACTURER") is the designation/tagline, not a separate company name.
- The large stylized brand/logo text (e.g. company name with a TM or registered trademark symbol) is the company name - use that for "company", not the tagline.
- If no person's name appears anywhere on the card, leave "name" as empty string - do not use the company name as a substitute.

Business card text:
${rawText}

Return only the JSON object, no explanation, no markdown formatting.`;

    const aiText = await callGemini(prompt);
    extractedContact = parseAIJson(aiText, extractedContact);
  } catch (err) {
    console.error('Retry extraction failed:', err.message);
    aiError = classifyGeminiError(err.message);
    const fallback = regexExtract(rawText);
    extractedContact = { ...extractedContact, ...fallback };
  }

  res.json({ success: true, extractedContact, aiError });
});

export { scanCard, generateAISummary, uploadVoiceNote, retryExtraction };