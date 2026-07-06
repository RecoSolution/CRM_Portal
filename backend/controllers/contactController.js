import Contact from '../models/Contact.js';
import asyncHandler from '../utils/asyncHandler.js';
import { applyRoleScope, applyContactScope } from '../utils/authScope.js';
import Task from '../models/Task.js';
import ExcelJS from 'exceljs';
// ────────────────────────────────────────────────────────
// @route   GET /api/contacts
// @desc    Get all contacts for logged in user
// @access  Private
// ────────────────────────────────────────────────────────
const getContacts = asyncHandler(async (req, res) => {
  const {
    search,
    type,
    folder,
    source,
    stage,
    assignedTo,
    page = 1,
    limit = 20,
  } = req.query;

  // Founder: sees all contacts. Employee: assigned to them OR unassigned-but-owned.
  const query = applyContactScope(req);

  if (type) query.relationshipType = type;
  if (folder) query.folder = folder;
  if (source) query.event = source;
  if (stage) query.currentStage = stage;
  if (assignedTo) query.assignedTo = assignedTo;

  // Text search
  if (search) {
    const regex = new RegExp(search, 'i'); // case-insensitive partial match
    query.$or = [
      { name: regex },
      { company: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const skip = (page - 1) * limit;
  const total = await Contact.countDocuments(query);

  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('folder', 'name')
    .populate('assignedTo', 'firstName lastName email');

  let contactsOut = contacts;

  if (req.query.includeTaskStatus === 'true') {
    const contactIds = contacts.map((c) => c._id);
    const openTasks = await Task.find({
      contact: { $in: contactIds },
      status: { $ne: 'Completed' },
    })
      .sort({ dueDate: 1 })
      .select('contact taskType');

    const taskByContact = {};
    openTasks.forEach((t) => {
      const key = t.contact.toString();
      if (!taskByContact[key]) taskByContact[key] = t.taskType; // earliest due wins
    });

    const LABEL_MAP = {
      'Follow-Up Call': 'Call Due',
      'Send Quotation': 'Quotation Pending',
      Meeting: 'Meeting Due',
      Email: 'Email Due',
      Reminder: 'Reminder Due',
      Other: 'Task Due',
    };

    contactsOut = contacts.map((c) => {
      const obj = c.toObject();
      const taskType = taskByContact[c._id.toString()];
      obj.taskStatusLabel = taskType ? LABEL_MAP[taskType] : null;
      return obj;
    });
  }

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    contacts: contactsOut,
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
    ...applyContactScope(req),
  })
    .populate('folder', 'name')
    .populate('assignedTo', 'firstName lastName email')
    .populate('collectedBy', 'firstName lastName email');

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  res.json({ success: true, contact });
});

// ────────────────────────────────────────────────────────
// @route   GET /api/contacts/export
// @desc    Export contacts as CSV — scope/type/date filterable
// @access  Private
// ────────────────────────────────────────────────────────
const exportContacts = asyncHandler(async (req, res) => {
  const { scope = 'all', type, dateFrom, dateTo, format = 'csv' } = req.query;

  // Base visibility always respects role — an Employee exporting
  // "All Contacts" still only gets what they're allowed to see.
  let query = applyContactScope(req);

  if (scope === 'mine') {
    query = { assignedTo: req.user.id };
  }
  if (type) {
    // NOTE: the schema field is `relationshipType`, not `type` — fixed here
    query = { ...query, relationshipType: type.toLowerCase() };
  }
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'firstName lastName')
    .populate('owner', 'firstName lastName');

  const headers = [
    'Name',
    'Company',
    'Designation',
    'Email',
    'Phone',
    'Website',
    'Address',
    'Relationship Type',
    'Category',
    'Lead Score',
    'Lead Category',
    'Assigned To',
    'Added By',
    'Created At',
  ];
  const rows = contacts.map((c) => [
    c.name || '',
    c.company || '',
    c.designation || '',
    c.email || '',
    c.phone || '',
    c.website || '',
    c.address || '',
    c.relationshipType || '',
    c.category || '',
    c.leadScore ?? '',
    c.leadCategory || '',
    c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : '',
    c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : '',
    c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : '',
  ]);

  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contacts');
    sheet.addRow(headers);
    rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="contacts-export.xlsx"',
    );
    await workbook.xlsx.write(res);
    return res.end();
  }

  // Default: CSV
  const escapeCell = (val) => `"${String(val).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="contacts-export.csv"',
  );
  res.status(200).send(csv);
});

// ────────────────────────────────────────────────────────
// @route   GET /api/contacts/check-duplicate
// @desc    Check if a contact with this email or phone already exists
// @access  Private
// ────────────────────────────────────────────────────────
const checkDuplicate = asyncHandler(async (req, res) => {
  const { email, phone } = req.query;

  if (!email && !phone) {
    return res.json({ success: true, duplicate: null });
  }

  const orConditions = [];
  if (email) orConditions.push({ email });
  if (phone) orConditions.push({ phone });

  const existing = await Contact.findOne({
    owner: req.user.id,
    $or: orConditions,
  });

  res.json({ success: true, duplicate: existing || null });
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
// @route   POST /api/contacts/:id/merge
// @desc    Merge new scan data into an existing contact (duplicate found)
// @access  Private
// ────────────────────────────────────────────────────────
const mergeContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  const fields = [
    'name',
    'company',
    'designation',
    'email',
    'phone',
    'website',
    'address',
    'event',
  ];
  fields.forEach((field) => {
    if (req.body[field]) contact[field] = req.body[field];
  });

  if (req.body.note) {
    contact.notes.push({
      content: req.body.note,
      type: 'text',
      createdBy: req.user.id,
    });
  }

  await contact.save();
  res.json({ success: true, contact });
});

// ────────────────────────────────────────────────────────
// @route   PUT /api/contacts/:id
// @desc    Update contact
// @access  Private
// ────────────────────────────────────────────────────────
const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    ...applyContactScope(req),
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
    ...applyContactScope(req),
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
    ...applyContactScope(req),
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
// Body: { task, dueDate, time, priority, note }
// ────────────────────────────────────────────────────────
const addReminder = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    ...applyContactScope(req),
  });

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  if (!req.body.dueDate) {
    return res
      .status(400)
      .json({ success: false, message: 'Due date is required.' });
  }

  contact.reminders.push({
    task: req.body.task || 'follow_up',
    dueDate: req.body.dueDate,
    time: req.body.time || '',
    priority: req.body.priority || 'medium',
    note: req.body.note || '',
    createdBy: req.user.id,
  });

  await contact.save();

  // Return just the newly created reminder (last item in array)
  const newReminder = contact.reminders[contact.reminders.length - 1];

  // ── Bridge into the Task system so it shows up in Tasks/Home ──
  // "Set Reminder" (scan flow) previously only wrote to Contact.reminders,
  // which the new Task-based Tasks page/Home dashboard never reads.
  const TASK_TYPE_MAP = {
    call: 'Follow-Up Call',
    send_quotation: 'Send Quotation',
    schedule_meeting: 'Meeting',
    email: 'Email',
    'follow-up': 'Reminder',
    follow_up: 'Reminder',
  };
  const PRIORITY_MAP = { low: 'Low', medium: 'Medium', high: 'High' };

  const due = new Date(req.body.dueDate);
  const now = new Date();
  let computedStatus = 'Upcoming';
  if (due.toDateString() === now.toDateString()) computedStatus = 'Today';
  else if (due < now) computedStatus = 'Overdue';

  await Task.create({
    title: `${(req.body.task || 'follow_up').replace(/_/g, ' ')} — ${contact.name}`,
    description: req.body.note || '',
    priority: PRIORITY_MAP[req.body.priority] || 'Medium',
    taskType: TASK_TYPE_MAP[req.body.task] || 'Other',
    status: computedStatus,
    assignedEmployee: req.user.id, // self-assigned reminder
    createdBy: req.user.id,
    contact: contact._id,
    dueDate: req.body.dueDate,
    dueTime: req.body.time || '',
    activityHistory: [
      {
        action: 'created',
        performedBy: req.user.id,
        detail: 'Created via contact reminder.',
      },
    ],
  });

  res.status(201).json({
    success: true,
    reminder: newReminder,
    reminders: contact.reminders,
  });
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
  }).select('name company phone reminders');

  res.json({ success: true, contacts });
});

// ────────────────────────────────────────────────────────
// @route   GET /api/contacts/reminders/all?filter=today|upcoming|overdue|done
// @desc    Get reminders for the Follow-up page tabs
// @access  Private
// ────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────
// @route   GET /api/contacts/reminders/all?filter=today|upcoming|overdue|completed
// @desc    Get reminders across all contacts, filtered by status/date
// @access  Private
// ────────────────────────────────────────────────────────
const getAllReminders = asyncHandler(async (req, res) => {
  const { filter = 'today' } = req.query;
  const userId = req.user.id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const now = new Date();

  const contacts = await Contact.find({
    owner: userId,
    'reminders.0': { $exists: true },
  }).select('name reminders');

  let flattened = [];
  contacts.forEach((contact) => {
    contact.reminders.forEach((r) => {
      flattened.push({
        _id: r._id,
        contactId: contact._id,
        contactName: contact.name,
        task: r.task,
        note: r.note,
        dueDate: r.dueDate,
        time: r.time,
        priority: r.priority,
        status: r.status,
        createdAt: r.createdAt,
      });
    });
  });

  // Apply filter
  if (filter === 'today') {
    flattened = flattened.filter(
      (r) =>
        r.status === 'pending' &&
        new Date(r.dueDate) >= startOfDay &&
        new Date(r.dueDate) <= endOfDay,
    );
  } else if (filter === 'upcoming') {
    flattened = flattened.filter(
      (r) => r.status === 'pending' && new Date(r.dueDate) > endOfDay,
    );
  } else if (filter === 'overdue') {
    flattened = flattened.filter(
      (r) => r.status === 'pending' && new Date(r.dueDate) < startOfDay,
    );
  } else if (filter === 'completed') {
    flattened = flattened.filter((r) => r.status === 'done');
  }

  // Sort: high priority first, then soonest due date
  const priorityRank = { high: 0, medium: 1, low: 2 };
  flattened.sort((a, b) => {
    const pa = priorityRank[a.priority] ?? 3;
    const pb = priorityRank[b.priority] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  res.json({ success: true, reminders: flattened });
});

// ────────────────────────────────────────────────────────
// @route   PUT /api/contacts/:id/reminders/:reminderId
// @desc    Update a reminder — status (done/snoozed/pending) and/or
//          edit its task, dueDate, time, priority, note
// @access  Private
// ────────────────────────────────────────────────────────
const updateReminderStatus = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  const reminder = contact.reminders.id(req.params.reminderId);
  if (!reminder) {
    return res
      .status(404)
      .json({ success: false, message: 'Reminder not found.' });
  }

  // Status update (mark done / snoozed / pending)
  if (req.body.status) {
    reminder.status = req.body.status;
  }

  // Snoozing to a new date
  if (req.body.status === 'snoozed' && req.body.newDueDate) {
    reminder.dueDate = req.body.newDueDate;
  }

  // Allow editing reminder details directly
  const editableFields = ['task', 'dueDate', 'time', 'priority', 'note'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) reminder[field] = req.body[field];
  });

  await contact.save();
  res.json({ success: true, reminder, reminders: contact.reminders });
});

export {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  addNote,
  addReminder,
  mergeContact,
  checkDuplicate,
  getAllReminders,
  getTodayReminders,
  updateReminderStatus,
  exportContacts,
};
