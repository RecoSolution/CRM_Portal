import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';
import Contact from '../models/Contact.js';

// ════════════════════════════════════════════════════════
// OCR.space - free, no card required
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
    throw new Error(
      `OCR.space error: ${data.ErrorMessage?.join(', ') || 'Unknown error'}`,
    );
  }

  return { text: data.ParsedResults?.[0]?.ParsedText?.trim() || '' };
}

// ════════════════════════════════════════════════════════
// Groq AI - name, company, designation ONLY
// ════════════════════════════════════════════════════════

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 150, // trimmed down - we only need a tiny JSON object back
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Groq error: ${data.error.message}`);
  return data.choices?.[0]?.message?.content || '{}';
}

function buildNameCompanyPrompt(rawText) {
  return `Extract these 3 fields from this OCR business card text. Return ONLY JSON, nothing else:
{"name": "person's full name", "company": "business name", "designation": "job title"}

RULES:
- name = a PERSON, never a company, phone, or email.
- company = the BUSINESS name (often near a logo, may have suffixes like Pvt Ltd, LLP, Industries, Associates).
- designation = job title only, not the company name.
- Use empty string "" if unsure. Never guess. Never put email/phone/website/address in these fields.

Text:
${rawText}

JSON only, no markdown.`;
}

function parseGroqJson(text, fallback = {}) {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return fallback;
  }
}

async function extractNameCompanyDesignation(rawText, fallback) {
  try {
    const aiText = await callGroq(buildNameCompanyPrompt(rawText));
    const parsed = parseGroqJson(aiText, null);
    if (!parsed) throw new Error('Could not parse Groq response');

    return {
      name: parsed.name || fallback.name || '',
      company: parsed.company || fallback.company || '',
      designation: parsed.designation || fallback.designation || '',
    };
  } catch (err) {
    console.error('Groq extraction failed, using fallback:', err.message);
    return fallback;
  }
}

// ════════════════════════════════════════════════════════
// Lightweight fallback for name/company/designation
// (only used if Groq fails - kept minimal since Groq is primary now)
// ════════════════════════════════════════════════════════

const TITLE_KEYWORDS = [
  'ceo',
  'cfo',
  'cto',
  'coo',
  'founder',
  'co-founder',
  'director',
  'manager',
  'president',
  'vice president',
  'vp',
  'executive',
  'head',
  'owner',
  'partner',
  'engineer',
  'designer',
  'analyst',
  'consultant',
  'lead',
  'supervisor',
  'coordinator',
  'officer',
  'administrator',
  'proprietor',
  'chairman',
];

function basicFallbackExtract(lines) {
  let designation = '';
  let designationIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (TITLE_KEYWORDS.some((kw) => lines[i].toLowerCase().includes(kw))) {
      designation = lines[i];
      designationIndex = i;
      break;
    }
  }

  const name =
    designationIndex > 0 ? lines[designationIndex - 1] : lines[0] || '';

  return { name, designation, company: '' };
}

// ════════════════════════════════════════════════════════
// Phone / email / website / address - regex + heuristic, unchanged behavior
// ════════════════════════════════════════════════════════

const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'rediffmail.com',
  'icloud.com',
  'live.com',
  'aol.com',
];
const PHONE_LABELS = [
  'mobile',
  'mob',
  'cell',
  'tel',
  'telephone',
  'phone',
  'contact',
  'office',
  'direct',
  'fax',
];
const INDIAN_STATE_CODES = [
  'AP',
  'AR',
  'AS',
  'BR',
  'CG',
  'CT',
  'GA',
  'GJ',
  'HR',
  'HP',
  'JH',
  'KA',
  'KL',
  'MP',
  'MH',
  'MN',
  'ML',
  'MZ',
  'NL',
  'OD',
  'OR',
  'PB',
  'RJ',
  'SK',
  'TN',
  'TS',
  'TR',
  'UP',
  'UT',
  'UK',
  'WB',
  'DL',
  'JK',
  'LA',
  'PY',
  'CH',
];
const COUNTRY_CODES = [
  'IND',
  'USA',
  'GBR',
  'UAE',
  'ESP',
  'DEU',
  'FRA',
  'CHN',
  'JPN',
  'SGP',
  'AUS',
  'CAN',
  'ITA',
  'NLD',
  'BRA',
  'ZAF',
  'KOR',
  'RUS',
];
const ADDRESS_KEYWORDS = [
  'street',
  'st.',
  'road',
  'rd.',
  'lane',
  'avenue',
  'ave',
  'sector',
  'block',
  'plot',
  'floor',
  'building',
  'complex',
  'estate',
  'industrial',
  'city',
  'nagar',
  'colony',
  'phase',
  'gidc',
  'mall',
  'tower',
  'park',
  'near',
  'opp',
  'opposite',
  'behind',
  'area',
  'circle',
  'cross',
  'highway',
  'chowk',
  'gate',
  'market',
  'society',
  'apartment',
  'flat',
];

function extractPhones(text) {
  const lines = text.split('\n');
  const phones = [];
  const phoneRegex =
    /(\+\d{1,4}[\s-]?)?(\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}/g;

  for (const line of lines) {
    const matches = line.match(phoneRegex) || [];
    for (const m of matches) {
      const digitsOnly = m.replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        phones.push(m.trim());
      }
    }
  }

  const seen = new Set();
  return phones.filter((p) => {
    const key = p.replace(/\D/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractWebsiteAndDomainCompany(textWithoutEmail) {
  const matches =
    textWithoutEmail.match(
      /\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|in|net|org|co)\b/gi,
    ) || [];
  const validWebsite = matches.find(
    (w) => !COMMON_EMAIL_DOMAINS.includes(w.toLowerCase()),
  );

  let domainCompanyGuess = '';
  if (validWebsite) {
    const domainPart = validWebsite
      .replace(/^www\./i, '')
      .replace(/\.(com|in|net|org|co)$/i, '');
    if (domainPart.length > 1) {
      domainCompanyGuess =
        domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
    }
  }

  return { website: validWebsite || '', domainCompanyGuess };
}

function regexExtractBasicFields(text) {
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  );
  const email = emailMatch ? emailMatch[0] : '';
  const textWithoutEmail = email ? text.replace(email, '') : text;

  const phones = extractPhones(text);
  const { website, domainCompanyGuess } =
    extractWebsiteAndDomainCompany(textWithoutEmail);

  return {
    email,
    phone: phones[0] || '',
    phone2: phones[1] || '',
    website,
    domainCompanyGuess,
  };
}

function stripFieldLabel(line) {
  return line
    .replace(/^\s*(office|works|tel|mobile|fax|email|web|address)\s*:\s*/i, '')
    .trim();
}

function scoreLineForAddress(line) {
  const stripped = stripFieldLabel(line);
  let score = /^\s*(office|works)\s*:/i.test(line) ? 4 : 0;
  const upper = stripped.toUpperCase();

  if (/\b\d{5,6}\b/.test(stripped)) score += 3;
  if (
    INDIAN_STATE_CODES.some((code) => new RegExp(`\\b${code}\\b`).test(upper))
  )
    score += 2;
  if (COUNTRY_CODES.some((code) => upper.includes(code))) score += 2;
  if (ADDRESS_KEYWORDS.some((kw) => stripped.toLowerCase().includes(kw)))
    score += 2;
  score += (stripped.match(/,/g) || []).length;

  return score;
}

function guessAddress(lines) {
  const scored = lines.map((line, i) => ({
    stripped: stripFieldLabel(line),
    score: scoreLineForAddress(line),
    index: i,
  }));
  const scores = scored.map((s) => s.score);

  const anchors = scored.filter((s) => s.score >= 2);
  if (anchors.length === 0) return '';

  const usedIndices = new Set();
  const clusters = [];

  for (const anchor of anchors) {
    if (usedIndices.has(anchor.index)) continue;
    let start = anchor.index;
    let end = anchor.index;
    while (start > 0 && scores[start - 1] >= 1) start--;
    while (end < lines.length - 1 && scores[end + 1] >= 1) end++;
    for (let i = start; i <= end; i++) usedIndices.add(i);
    clusters.push({
      lines: scored.slice(start, end + 1),
      total: scored.slice(start, end + 1).reduce((sum, s) => sum + s.score, 0),
    });
  }

  if (clusters.length === 0) return '';
  const bestCluster = clusters.reduce((best, c) =>
    c.total > best.total ? c : best,
  );
  return bestCluster.lines.map((s) => s.stripped).join(', ');
}

// ════════════════════════════════════════════════════════
// Main extraction - runs OCR parsing once, splits into
// regex fields (fast, sync) + Groq fields (async, parallel-safe)
// ════════════════════════════════════════════════════════

async function extractContactFields(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const basics = regexExtractBasicFields(rawText);
  const address = guessAddress(lines);
  const fallback = basicFallbackExtract(lines);

  const aiFields = await extractNameCompanyDesignation(rawText, fallback);

  return {
    name: aiFields.name,
    designation: aiFields.designation,
    company: aiFields.company,
    address,
    email: basics.email,
    phone: basics.phone,
    phone2: basics.phone2,
    website: basics.website,
  };
}

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ocr
// ────────────────────────────────────────────────────────
const scanCard = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'Please upload an image.' });
  }

  const base64Image = req.file.buffer.toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

  // Run Cloudinary upload and OCR in PARALLEL - they're independent,
  // this alone saves however long the slower of the two takes (previously
  // they ran one after another, adding their times together).
  let imageUrl, rawText;
  try {
    const [uploadResult, ocrResult] = await Promise.all([
      cloudinary.uploader.upload(dataUri, { folder: 'recosolution/cards' }),
      recognizeWithOcrSpace(base64Image, req.file.mimetype),
    ]);
    imageUrl = uploadResult.secure_url;
    rawText = ocrResult.text;
  } catch (err) {
    console.error('Scan failed:', err.message);
    return res.status(502).json({
      success: false,
      message: 'Could not process the card. Please try again.',
    });
  }

  if (!rawText) {
    return res.status(400).json({
      success: false,
      message: 'Could not read text from card. Please retake a clearer photo.',
    });
  }

  const extractedContact = await extractContactFields(rawText);

  res.json({
    success: true,
    rawText,
    extractedContact,
    cardImageUrl: imageUrl,
    aiError: null,
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ai-summary - DISABLED, returns existing values
// ────────────────────────────────────────────────────────
const generateAISummary = asyncHandler(async (req, res) => {
  const { contactId } = req.body;
  const contact = await Contact.findOne({ _id: contactId, owner: req.user.id });
  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
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
// ────────────────────────────────────────────────────────
const retryExtraction = asyncHandler(async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) {
    return res
      .status(400)
      .json({ success: false, message: 'No raw text provided.' });
  }
  const extractedContact = await extractContactFields(rawText);
  res.json({ success: true, extractedContact, aiError: null });
});

export { scanCard, generateAISummary, uploadVoiceNote, retryExtraction };