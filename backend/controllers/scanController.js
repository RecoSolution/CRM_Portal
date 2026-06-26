import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';
import Contact from '../models/Contact.js';

/*
[... Gemini code stays commented out exactly as before, omitted here for brevity ...]
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
    throw new Error(
      `OCR.space error: ${data.ErrorMessage?.join(', ') || 'Unknown error'}`,
    );
  }

  const text = data.ParsedResults?.[0]?.ParsedText?.trim() || '';
  return { text };
}

// ════════════════════════════════════════════════════════
// Pattern-matching extraction (no AI)
// ════════════════════════════════════════════════════════

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

const NAME_HINTS = [
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'shri',
  'smt',
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

// Expanded company suffix list, covering common Indian + international forms
const COMPANY_SUFFIXES = [
  'pvt',
  'p. ltd',
  'pvt. ltd',
  'private limited',
  'ltd',
  'limited',
  'llp',
  'inc',
  'incorporated',
  'corp',
  'corporation',
  'co. ltd',
  'company',
  'enterprises',
  'industries',
  'solutions',
  'group',
  'international',
  'associates',
  'agency',
  'agencies',
  'traders',
  'exports',
  'imports',
  'manufacturer',
  'manufacturers',
  'works',
];

// Labels that typically precede a phone number on a card
const PHONE_LABELS = [
  'mobile',
  'mob',
  'cell',
  'tel',
  'telephone',
  'phone',
  'contact',
  'mobile1',
  'mobile2',
  'm1',
  'm2',
  'office',
  'direct',
  'fax',
];

// Indian state codes (used as confidence signal for address detection)
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

// Common 3-letter country codes that might appear on international cards
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

// Address-related keywords that boost confidence a line is an address
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

// ── Phone extraction: finds ALL phone numbers, handles labels and
//    international country codes (+91, +1, +44, +971, etc.) ──
function extractPhones(text) {
  const lines = text.split('\n');
  const phones = [];

  // Matches: optional +countrycode, then 7-13 digits with optional spaces/dashes
  // Covers +91 (India), +1 (US/Canada), +44 (UK), +971 (UAE), +61 (Australia), etc.
  const phoneRegex =
    /(\+\d{1,4}[\s-]?)?(\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}/g;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const hasPhoneLabel = PHONE_LABELS.some((label) => lower.includes(label));

    const matches = line.match(phoneRegex) || [];
    for (const m of matches) {
      const digitsOnly = m.replace(/\D/g, '');
      // Valid phone numbers have 7-15 digits (covers local to full international)
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        phones.push({
          value: m.trim(),
          hasLabel: hasPhoneLabel,
        });
      }
    }
  }

  // Deduplicate by digit content (avoid storing the same number twice
  // if OCR repeats it or it matches on multiple label lines)
  const seen = new Set();
  const unique = [];
  for (const p of phones) {
    const key = p.value.replace(/\D/g, '');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p.value);
    }
  }

  return unique; // array of phone number strings, in order of appearance
}

// ── Website + company-from-domain extraction ──
function extractWebsiteAndDomainCompany(textWithoutEmail) {
  const websiteMatches =
    textWithoutEmail.match(
      /\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|in|net|org|co)\b/gi,
    ) || [];
  const validWebsite = websiteMatches.find(
    (w) => !COMMON_EMAIL_DOMAINS.includes(w.toLowerCase()),
  );

  let domainCompanyGuess = '';
  if (validWebsite) {
    // "www.recosolution.com" -> "recosolution" -> "Recosolution"
    const domainPart = validWebsite
      .replace(/^www\./i, '')
      .replace(/\.(com|in|net|org|co)$/i, '');
    if (domainPart && domainPart.length > 1) {
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
    phone: phones[0] || '', // primary phone (first found)
    phone2: phones[1] || '', // secondary phone, if present
    allPhones: phones, // full array, in case you want to show all
    website,
    domainCompanyGuess,
  };
}

// ── Company name: tries suffix match, then website-domain guess,
//    then ALL-CAPS line, in that priority order ──
function guessCompany(lines, designationIndex, domainCompanyGuess) {
  // Never consider a line that contains an email address as the company name
  const isEmailLine = (line) =>
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(line);

  const suffixLine = lines.find(
    (l) =>
      !isEmailLine(l) &&
      COMPANY_SUFFIXES.some((suffix) => l.toLowerCase().includes(suffix)),
  );
  if (suffixLine) return suffixLine;

  if (domainCompanyGuess) return domainCompanyGuess;

  const allCapsLine = lines.find((l, i) => {
    const isAllCaps = l === l.toUpperCase() && /[A-Z]/.test(l);
    const isLongEnough = l.length > 3 && l.length < 40;
    return (
      isAllCaps && isLongEnough && i !== designationIndex && !isEmailLine(l)
    );
  });

  return allCapsLine || '';
}

function scoreLine(line) {
  let score = 0;
  const upper = line.toUpperCase();

  // PIN / ZIP
  if (/\b\d{5,6}\b/.test(line)) score += 3;

  // Indian state code
  if (
    INDIAN_STATE_CODES.some((code) => new RegExp(`\\b${code}\\b`).test(upper))
  ) {
    score += 2;
  }

  // Country code
  if (COUNTRY_CODES.some((code) => new RegExp(`\\b${code}\\b`).test(upper))) {
    score += 2;
  }

  // Address keywords
  if (ADDRESS_KEYWORDS.some((kw) => line.toLowerCase().includes(kw))) {
    score += 2;
  }

  // Commas usually indicate structured addresses
  score += (line.match(/,/g) || []).length;

  return score;
}

// ── Address: scores each line by how many "address signals" it has
//    (PIN code, state code, country code, address keywords, commas)
//    and picks the highest-scoring line instead of just the first match ──
function guessAddress(lines) {
  const scores = lines.map((line) => scoreLine(line));

  // Find the strongest address line (anchor)
  let anchorIndex = -1;
  let anchorScore = 0;

  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > anchorScore) {
      anchorScore = scores[i];
      anchorIndex = i;
    }
  }

  // No confident address found
  if (anchorIndex === -1 || anchorScore < 2) {
    return '';
  }

  // Expand upward
  let start = anchorIndex;
  while (start > 0 && scores[start - 1] >= 1) {
    start--;
  }

  // Expand downward
  let end = anchorIndex;
  while (end < lines.length - 1 && scores[end + 1] >= 1) {
    end++;
  }

  // Limit address to at most 4 lines
  if (end - start > 3) {
    end = start + 3;
  }

  return lines.slice(start, end + 1).join(', ');
}

function heuristicExtract(rawText, domainCompanyGuess) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  let designation = '';
  let designationIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (TITLE_KEYWORDS.some((kw) => lower.includes(kw))) {
      designation = lines[i];
      designationIndex = i;
      break;
    }
  }

  let name = '';
  if (designationIndex > 0 && looksLikeName(lines[designationIndex - 1])) {
    name = lines[designationIndex - 1];
  } else {
    const candidates = lines.filter((l) => looksLikeName(l));
    const withSurnameHint = candidates.find((l) =>
      NAME_HINTS.some((hint) => l.toLowerCase().includes(hint)),
    );
    name = withSurnameHint || candidates[0] || '';
  }

  const address = guessAddress(lines);
  const company = guessCompany(lines, designationIndex, domainCompanyGuess);

  return { name, designation, address, company };
}

function extractContactFields(rawText) {
  const basics = regexExtractBasicFields(rawText);
  const heuristics = heuristicExtract(rawText, basics.domainCompanyGuess);

  return {
    name: heuristics.name,
    designation: heuristics.designation,
    address: heuristics.address,
    company: heuristics.company,
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
      message:
        'OCR service is temporarily unavailable. Please try again in a moment.',
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
  const extractedContact = extractContactFields(rawText);
  res.json({ success: true, extractedContact, aiError: null });
});

export { scanCard, generateAISummary, uploadVoiceNote, retryExtraction };
