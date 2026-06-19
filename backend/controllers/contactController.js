import Contact from '../models/Contact.js';
import asyncHandler from '../utils/asyncHandler.js';

// ────────────────────────────────────────────────────────
// @route   GET /api/contacts
// @desc    Get all contacts for logged in user
// @access  Private
// ────────────────────────────────────────────────────────
const getContacts = asyncHandler(async (req, res) => {
  const { search, type, folder, page = 1, limit = 20 } = req.query;

  // Build filter query
  const query = { owner: req.user.id };

  if (type) query.relationshipType = type;
  if (folder) query.folder = folder;

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;
  const total = await Contact.countDocuments(query);

  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('folder', 'name')
    .populate('assignedTo', 'name email');

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    contacts,
  });
});

// ────────────────────────────────────────────────────────
// @route   GET /api/contacts/:id
// @desc    Get single contact
// @access  Private
// ────────────────────────────────────────────────────────
const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  })
    .populate('folder', 'name')
    .populate('assignedTo', 'name email')
    .populate('collectedBy', 'name');

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  res.json({ success: true, contact });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/contacts
// @desc    Create contact manually
// @access  Private
// ────────────────────────────────────────────────────────
const createContact = asyncHandler(async (req, res) => {
  const contact = await Contact.create({
    ...req.body,
    owner: req.user.id,
    collectedBy: req.user.id,
  });

  res.status(201).json({ success: true, contact });
});

// ────────────────────────────────────────────────────────
// @route   PUT /api/contacts/:id
// @desc    Update contact
// @access  Private
// ────────────────────────────────────────────────────────
const updateContact = asyncHandler(async (req, res) => {
  let contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, contact });
});

// ────────────────────────────────────────────────────────
// @route   DELETE /api/contacts/:id
// @desc    Delete contact
// @access  Private
// ────────────────────────────────────────────────────────
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  await contact.deleteOne();

  res.json({ success: true, message: 'Contact deleted.' });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/contacts/:id/notes
// @desc    Add note to contact
// @access  Private
// ────────────────────────────────────────────────────────
const addNote = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  contact.notes.push({
    content: req.body.content,
    type: req.body.type || 'text',
    createdBy: req.user.id,
  });

  await contact.save();
  res.json({ success: true, notes: contact.notes });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/contacts/:id/reminders
// @desc    Add reminder to contact
// @access  Private
// ────────────────────────────────────────────────────────
const addReminder = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  contact.reminders.push({
    dueDate: req.body.dueDate,
    note: req.body.note,
    createdBy: req.user.id,
  });

  await contact.save();
  res.json({ success: true, reminders: contact.reminders });
});

// ────────────────────────────────────────────────────────
// @route   GET /api/contacts/reminders/today
// @desc    Get all reminders due today for logged in user
// @access  Private
// ────────────────────────────────────────────────────────
const getTodayReminders = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const contacts = await Contact.find({
    owner: req.user.id,
    'reminders.dueDate': { $gte: startOfDay, $lte: endOfDay },
    'reminders.status': 'pending',
  }).select('name company reminders');

  res.json({ success: true, contacts });
});

export {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  addNote,
  addReminder,
  getTodayReminders,
};
