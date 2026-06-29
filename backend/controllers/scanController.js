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
// Constants
// ════════════════════════════════════════════════════════

const TITLE_KEYWORDS = [
  // C-Level Executives
  'ceo',
  'chief executive officer',
  'cfo',
  'chief financial officer',
  'cto',
  'chief technology officer',
  'coo',
  'chief operating officer',
  'cio',
  'chief information officer',
  'cmo',
  'chief marketing officer',
  'chief sales officer',
  'chief strategy officer',
  'chief compliance officer',
  'chief legal officer',
  'chief security officer',
  'chief business officer',
  'chief architect',

  // Founders
  'founder',
  'co-founder',
  'cofounder',
  'owner',
  'proprietor',
  'partner',
  'managing partner',

  // Directors
  'director',
  'managing director',
  'executive director',
  'technical director',
  'creative director',
  'sales director',
  'operations director',
  'marketing director',
  'finance director',
  'hr director',

  // Presidents
  'president',
  'vice president',
  'vice-president',
  'vp',
  'svp',
  'evp',
  'assistant vice president',
  'associate vice president',

  // General Management
  'general manager',
  'deputy general manager',
  'assistant general manager',
  'manager',
  'senior manager',
  'assistant manager',
  'branch manager',
  'project manager',
  'program manager',
  'product manager',
  'account manager',
  'operations manager',
  'plant manager',
  'production manager',
  'purchase manager',
  'procurement manager',
  'warehouse manager',
  'store manager',
  'marketing manager',
  'sales manager',
  'export manager',
  'import manager',
  'business manager',
  'finance manager',
  'hr manager',
  'office manager',
  'service manager',
  'quality manager',

  // Heads
  'head',
  'department head',
  'team head',
  'head of sales',
  'head of marketing',
  'head of operations',
  'head of finance',
  'head of hr',
  'head of engineering',
  'head of design',
  'head of product',

  // Engineering
  'engineer',
  'software engineer',
  'senior software engineer',
  'staff engineer',
  'principal engineer',
  'design engineer',
  'mechanical engineer',
  'electrical engineer',
  'electronics engineer',
  'civil engineer',
  'chemical engineer',
  'industrial engineer',
  'project engineer',
  'site engineer',
  'service engineer',
  'field engineer',
  'network engineer',
  'devops engineer',
  'cloud engineer',
  'qa engineer',
  'test engineer',
  'automation engineer',

  // Developers
  'developer',
  'frontend developer',
  'backend developer',
  'full stack developer',
  'web developer',
  'mobile developer',
  'software developer',
  'application developer',

  // Architects
  'architect',
  'solution architect',
  'software architect',
  'enterprise architect',
  'technical architect',

  // Designers
  'designer',
  'graphic designer',
  'ui designer',
  'ux designer',
  'ui/ux designer',
  'product designer',
  'creative designer',
  'interior designer',

  // Analysts
  'analyst',
  'business analyst',
  'data analyst',
  'financial analyst',
  'research analyst',
  'system analyst',
  'security analyst',

  // Consultants
  'consultant',
  'business consultant',
  'technical consultant',
  'it consultant',
  'financial consultant',
  'legal consultant',

  // Sales
  'sales executive',
  'sales officer',
  'sales representative',
  'sales consultant',
  'sales engineer',
  'sales manager',
  'sales coordinator',

  // Marketing
  'marketing executive',
  'marketing manager',
  'digital marketing executive',
  'digital marketing manager',
  'seo executive',
  'seo specialist',
  'content manager',
  'content writer',
  'brand manager',

  // Business
  'business development',
  'business development executive',
  'business development manager',
  'business consultant',
  'business partner',

  // HR
  'human resources',
  'hr',
  'hr executive',
  'hr manager',
  'hr officer',
  'recruiter',
  'talent acquisition',
  'talent acquisition manager',

  // Finance
  'finance',
  'finance executive',
  'finance manager',
  'finance officer',
  'accountant',
  'chartered accountant',
  'accounts executive',
  'accounts manager',
  'auditor',

  // Operations
  'operations',
  'operations executive',
  'operations manager',
  'operation executive',
  'operation manager',

  // Admin
  'administrator',
  'admin',
  'admin executive',
  'office administrator',
  'office executive',

  // Legal
  'advocate',
  'lawyer',
  'attorney',
  'legal advisor',
  'legal consultant',

  // Procurement
  'procurement officer',
  'purchase officer',
  'purchase executive',
  'buyer',

  // Logistics
  'logistics manager',
  'supply chain manager',
  'warehouse supervisor',
  'dispatch manager',

  // Production
  'production engineer',
  'production supervisor',
  'production executive',

  // Quality
  'quality engineer',
  'quality inspector',
  'quality executive',
  'quality assurance',
  'quality control',

  // Healthcare
  'doctor',
  'physician',
  'surgeon',
  'dentist',
  'pharmacist',
  'nurse',
  'medical officer',

  // Education
  'teacher',
  'professor',
  'lecturer',
  'principal',
  'dean',
  'trainer',

  // Government
  'officer',
  'inspector',
  'commissioner',

  // Generic
  'executive',
  'associate',
  'assistant',
  'lead',
  'team lead',
  'technical lead',
  'project lead',
  'coordinator',
  'supervisor',
  'specialist',
  'advisor',
  'representative',
  'secretary',
  'chairman',
  'chairperson',
  'member',
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

// Negative name words — structurally look like names but aren't
const NEGATIVE_NAME_WORDS = [
  'sales',
  'marketing',
  'support',
  'admin',
  'office',
  'department',
  'team',
  'division',
  'branch',
  'head office',
  'regional office',
  'customer care',
  'helpdesk',
  'reception',
  'general manager office',
];

// ════════════════════════════════════════════════════════
// SCORING-BASED COMPANY SUFFIX PATTERNS
// Uses word-boundary regex to avoid false matches like
// "Corporate Road" matching "corp", "Cole Street" matching "co", etc.
// ════════════════════════════════════════════════════════

const COMPANY_SUFFIX_PATTERNS = [
  { pattern: /\bpvt\.?\s*ltd\.?\b/i, weight: 5 },
  { pattern: /\bprivate\s+limited\b/i, weight: 5 },
  { pattern: /\bllp\b/i, weight: 5 },
  { pattern: /\binc\.?\b(?!\w)/i, weight: 4 },
  { pattern: /\bincorporated\b/i, weight: 5 },
  { pattern: /\bcorporation\b/i, weight: 5 },
  { pattern: /\bco\.\s*ltd\.?\b/i, weight: 5 },
  { pattern: /\b(the\s+)?\w+\s+company\b/i, weight: 4 },
  { pattern: /\benterprises\b/i, weight: 4 },
  { pattern: /\bindustries\b/i, weight: 4 },
  { pattern: /\bsolutions\b/i, weight: 3 },
  { pattern: /\bgroup\b/i, weight: 3 },
  { pattern: /\binternational\b/i, weight: 2 },
  { pattern: /\bassociates\b/i, weight: 3 },
  { pattern: /\bagencies?\b/i, weight: 3 },
  { pattern: /\btraders\b/i, weight: 3 },
  { pattern: /\bexports?\b/i, weight: 3 },
  { pattern: /\bimports?\b/i, weight: 3 },
  { pattern: /\bmanufacturers?\b/i, weight: 3 },
  { pattern: /\bworks\b/i, weight: 2 },
  { pattern: /\bgreen\s*energy\b/i, weight: 2 },
  { pattern: /\brecycl\w*\b/i, weight: 2 },
];

// ════════════════════════════════════════════════════════
// Field-type detection helpers
// ════════════════════════════════════════════════════════

function isEmailLine(line) {
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(line);
}

function isWebsiteLine(line) {
  return /\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|in|net|org|co)\b/i.test(line);
}

function isPhoneLine(line) {
  return /\d{7,}/.test(line);
}

function isAddressLine(line) {
  const lower = line.toLowerCase();
  const addressIndicators = [
    'road',
    'street',
    'st.',
    'lane',
    'avenue',
    'ave',
    'sector',
    'block',
    'plot',
    'floor',
    'near',
    'opp',
    'opposite',
    'behind',
    'colony',
    'nagar',
    'society',
    'apartment',
    'flat',
    'building',
    'complex',
    'estate',
    'industrial',
    'gidc',
    'highway',
    'chowk',
    'circle',
    'area',
  ];
  return addressIndicators.some((kw) => lower.includes(kw));
}

// A line is "claimed" if it's structurally an address, email, website,
// or phone - these can never be a company or person's name, no exceptions.
function isClaimedByOtherField(line) {
  return (
    isAddressLine(line) ||
    isEmailLine(line) ||
    isWebsiteLine(line) ||
    isPhoneLine(line)
  );
}

function stripFieldLabel(line) {
  return line
    .replace(/^\s*(office|works|tel|mobile|fax|email|web|address)\s*:\s*/i, '')
    .trim();
}
// ════════════════════════════════════════════════════════
// Phone extraction
// ════════════════════════════════════════════════════════

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

  // Deduplicate by digit content
  const seen = new Set();
  const unique = [];
  for (const p of phones) {
    const key = p.value.replace(/\D/g, '');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p.value);
    }
  }

  return unique;
}

// ════════════════════════════════════════════════════════
// Website + company-from-domain extraction
// ════════════════════════════════════════════════════════

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
    phone: phones[0] || '',
    phone2: phones[1] || '',
    allPhones: phones,
    website,
    domainCompanyGuess,
  };
}

// ════════════════════════════════════════════════════════
// Address scoring
// ════════════════════════════════════════════════════════

function scoreLineForAddress(line) {
  const stripped = stripFieldLabel(line);
  let score = /^\s*(office|works)\s*:/i.test(line) ? 4 : 0;

  const upper = stripped.toUpperCase();

  // PIN / ZIP
  if (/\b\d{5,6}\b/.test(stripped)) score += 3;

  // Indian state code
  if (
    INDIAN_STATE_CODES.some((code) => new RegExp(`\\b${code}\\b`).test(upper))
  ) {
    score += 2;
  }

  // Country code — use .includes() so "INDIA" matches "IND", "SPAIN" matches "ESP"
  if (COUNTRY_CODES.some((code) => upper.includes(code))) {
    score += 2;
  }

  // Address keywords
  if (ADDRESS_KEYWORDS.some((kw) => stripped.toLowerCase().includes(kw))) {
    score += 2;
  }

  // Commas usually indicate structured addresses
  score += (stripped.match(/,/g) || []).length;

  return score;
}

function guessAddress(lines) {
  const scored = lines.map((line, i) => ({
    original: line,
    stripped: stripFieldLabel(line),
    score: scoreLineForAddress(line),
    index: i,
  }));

  const scores = scored.map((s) => s.score);

  // Find all anchor lines with score >= 2
  const anchors = scored.filter((s) => s.score >= 2);
  if (anchors.length === 0) return '';

  // Build contiguous clusters around each anchor
  const usedIndices = new Set();
  const clusters = [];

  for (const anchor of anchors) {
    if (usedIndices.has(anchor.index)) continue;

    let start = anchor.index;
    let end = anchor.index;

    // Expand upward while score >= 1
    while (start > 0 && scores[start - 1] >= 1) start--;
    // Expand downward while score >= 1
    while (end < lines.length - 1 && scores[end + 1] >= 1) end++;

    // Mark all indices in this cluster as used
    for (let i = start; i <= end; i++) usedIndices.add(i);

    clusters.push({
      start,
      end,
      lines: scored.slice(start, end + 1),
      total: scored.slice(start, end + 1).reduce((sum, s) => sum + s.score, 0),
    });
  }

  if (clusters.length === 0) return '';

  // Pick the cluster with the highest total score
  const bestCluster = clusters.reduce((best, c) =>
    c.total > best.total ? c : best,
  );

  // Return stripped lines (OFFICE:/WORKS: prefix removed) joined
  return bestCluster.lines.map((s) => s.stripped).join(', ');
}

// ════════════════════════════════════════════════════════
// Company scoring
// ════════════════════════════════════════════════════════

function scoreLineForCompany(line, allLines, lineIndex, designationIndex) {
  if (isClaimedByOtherField(line)) return -100;

  let score = 0;

  // Suffix pattern matches (weighted)
  for (const { pattern, weight } of COMPANY_SUFFIX_PATTERNS) {
    if (pattern.test(line)) score += weight;
  }

  // ALL-CAPS lines often = logo/brand text in OCR output
  const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
  if (isAllCaps && line.length > 3 && line.length < 40) score += 2;

  // Lines that appear MORE THAN ONCE in the card are a strong signal -
  // company names/logos are frequently repeated (header + footer, logo + tagline area)
  const occurrences = allLines.filter(
    (l) => l.toLowerCase() === line.toLowerCase(),
  ).length;
  if (occurrences > 1) score += 3;

  // Isolated lines (surrounded by blank-ish short lines) often indicate
  // a standalone logo/brand text rather than running prose
  const prevLine = allLines[lineIndex - 1] || '';
  const nextLine = allLines[lineIndex + 1] || '';
  if (prevLine.length < 3 || nextLine.length < 3) score += 1;

  // Penalize if this line IS the designation line itself
  if (lineIndex === designationIndex) score -= 5;

  // Penalize very long lines (company names are rarely full sentences)
  if (line.length > 45) score -= 2;

  return score;
}

// ════════════════════════════════════════════════════════
// Name scoring
// ════════════════════════════════════════════════════════

function scoreLineForName(line, allLines, lineIndex, designationIndex) {
  if (isClaimedByOtherField(line)) return -100;

  const lower = line.toLowerCase();
  if (NEGATIVE_NAME_WORDS.some((w) => lower.includes(w))) return -100;

  const words = line.trim().split(/\s+/);
  const wordCount = words.length;
  const hasSymbols = /[@/\\#*_~|<>{}[\]]/.test(line);
  const isReasonableLength = line.length >= 4 && line.length < 45;

  if (hasSymbols || !isReasonableLength) return -100;
  if (wordCount < 2 || wordCount > 4) return -100;

  let score = 1; // base score for passing structural checks

  // Directly adjacent to designation line = strong signal
  if (designationIndex > 0 && lineIndex === designationIndex - 1) score += 5;
  if (designationIndex >= 0 && lineIndex === designationIndex + 1) score += 2;

  // Matches known surname/honorific hints
  if (NAME_HINTS.some((hint) => lower.includes(hint))) score += 3;

  // Title case (first letter of each word capitalized)
  const isTitleCase = words.every((w) => w[0] === w[0]?.toUpperCase());
  if (isTitleCase) score += 1;

  // Penalize all-caps lines for name (more likely a company/logo)
  if (line === line.toUpperCase()) score -= 2;

  return score;
}

// ════════════════════════════════════════════════════════
// Generic best-line picker (scoring-based)
// ════════════════════════════════════════════════════════

function pickBestScoredLine(lines, scoreFn, designationIndex, minScore = 1) {
  let best = '';
  let bestScore = -Infinity;

  lines.forEach((line, i) => {
    const score = scoreFn(line, lines, i, designationIndex);
    if (score > bestScore) {
      bestScore = score;
      best = line;
    }
  });

  return bestScore >= minScore ? best : '';
}

// ════════════════════════════════════════════════════════
// Main heuristic extraction
// ════════════════════════════════════════════════════════

function heuristicExtract(rawText, domainCompanyGuess) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // ── Designation: keyword match ──
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

  // ── Name: scoring-based selection ──
  const name = pickBestScoredLine(
    lines,
    (line, allLines, i) =>
      scoreLineForName(line, allLines, i, designationIndex),
    designationIndex,
    2,
  );

  // ── Company: scoring-based selection, falls back to domain guess ──
  let company = pickBestScoredLine(
    lines,
    (line, allLines, i) =>
      scoreLineForCompany(line, allLines, i, designationIndex),
    designationIndex,
    2,
  );

  if (!company && domainCompanyGuess) {
    const genericDomainWords = [
      'mail',
      'contact',
      'info',
      'support',
      'admin',
      'site',
      'page',
    ];
    if (!genericDomainWords.includes(domainCompanyGuess.toLowerCase())) {
      company = domainCompanyGuess;
    }
  }

  // ── Address: cluster-expansion logic, excluding lines already claimed as company ──
  const addressCandidateLines = lines.filter((l) => l !== company);
  const address = guessAddress(addressCandidateLines);

  return { name, designation, address, company };
}

// ════════════════════════════════════════════════════════
// Top-level contact field extractor
// ════════════════════════════════════════════════════════

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
