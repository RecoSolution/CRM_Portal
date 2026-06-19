import asyncHandler from '../utils/asyncHandler.js';
import cloudinary from '../config/cloudinary.js';
import Contact from '../models/Contact.js';

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ocr
// @desc    Upload card image → OCR → AI extract contact info
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

  // ── Step 2: Send to Google Vision OCR ───────────────
  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    },
  );

  const visionData = await visionRes.json();
  const rawText = visionData.responses?.[0]?.fullTextAnnotation?.text || '';

  if (!rawText) {
    return res.status(400).json({
      success: false,
      message: 'Could not read text from card. Please retake photo.',
    });
  }

  // ── Step 3: Send raw text to Claude AI ──────────────
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Extract contact information from this business card text and return ONLY a JSON object with these fields: name, company, designation, email, phone, website, address. If a field is not found, use empty string "".

Business card text:
${rawText}

Return only the JSON, no explanation.`,
        },
      ],
    }),
  });

  const claudeData = await claudeRes.json();
  const aiText = claudeData.content?.[0]?.text || '{}';

  // Parse AI response
  let extractedContact = {};
  try {
    const cleaned = aiText.replace(/```json|```/g, '').trim();
    extractedContact = JSON.parse(cleaned);
  } catch {
    extractedContact = {
      name: '',
      company: '',
      designation: '',
      email: '',
      phone: '',
      website: '',
      address: '',
    };
  }

  res.json({
    success: true,
    rawText,
    extractedContact,
    cardImageUrl: imageUrl,
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/scan/ai-summary
// @desc    Generate AI summary for a contact
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

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are a sales assistant for RecoSolution, a plastic recycling machinery company.
Write a 2-3 sentence summary for this contact and give a lead score out of 100.
Return ONLY JSON: { "summary": "...", "leadScore": 75, "leadCategory": "hot|warm|cold" }

Contact:
Name: ${contact.name}
Company: ${contact.company}
Designation: ${contact.designation}
Event: ${contact.event}
Notes: ${contact.notes.map((n) => n.content).join('. ')}`,
        },
      ],
    }),
  });

  const data = await claudeRes.json();
  const aiText = data.content?.[0]?.text || '{}';

  let result = { summary: '', leadScore: 0, leadCategory: 'cold' };
  try {
    const cleaned = aiText.replace(/```json|```/g, '').trim();
    result = JSON.parse(cleaned);
  } catch {}

  // Save to contact
  contact.aiSummary = result.summary;
  contact.leadScore = result.leadScore;
  contact.leadCategory = result.leadCategory;
  await contact.save();

  res.json({ success: true, ...result });
});

export { scanCard, generateAISummary };
