import Contact from '../models/Contact.js';
import asyncHandler from '../utils/asyncHandler.js';
import { applyRoleScope, applyContactScope } from '../utils/authScope.js';
import Task from '../models/Task.js';
import ExcelJS from 'exceljs';
import { upsertContactInBigin } from '../utils/zoho.js';

// ────────────────────────────────────────────────────────
// GET /api/contacts
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

  const query = applyContactScope(req);

  if (type) query.relationshipType = type;
  if (folder) query.folder = folder;
  if (source) query.event = source;
  if (stage) query.currentStage = stage;
  if (assignedTo) query.assignedTo = assignedTo;

  if (search) {
    const regex = new RegExp(search, 'i');
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
      .select('contact taskType _id');

    const taskByContact = {};
    openTasks.forEach((t) => {
      const key = t.contact.toString();
      if (!taskByContact[key]) taskByContact[key] = t;
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
      const openTask = taskByContact[c._id.toString()];
      obj.taskStatusLabel = openTask ? LABEL_MAP[openTask.taskType] : null;
      obj.openTaskId = openTask ? openTask._id : null;
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
// GET /api/contacts/:id
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
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  res.json({ success: true, contact });
});

// ────────────────────────────────────────────────────────
// GET /api/contacts/export
// ────────────────────────────────────────────────────────
const exportContacts = asyncHandler(async (req, res) => {
  const { scope = 'all', type, dateFrom, dateTo, format = 'csv', contactId } = req.query;

  if (contactId) {
    const scopedQuery = { _id: contactId, ...applyContactScope(req) };
    const contact = await Contact.findOne(scopedQuery)
      .populate('assignedTo', 'firstName lastName')
      .populate('owner', 'firstName lastName');

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    return sendContactFile(res, [contact], format, contact.name || 'contact');
  }

  let query = applyContactScope(req);

  if (scope === 'mine') {
    query = { assignedTo: req.user.id };
  }
  if (type) {
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

  return sendContactFile(res, contacts, format, 'contacts-export');
});

async function sendContactFile(res, contacts, format, filenameBase) {
  const headers = [
    'Name', 'Company', 'Designation', 'Email', 'Phone', 'Website',
    'Address', 'Relationship Type', 'Category', 'Lead Score',
    'Lead Category', 'Assigned To', 'Added By', 'Created At',
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

  const safeName = filenameBase.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'contact';

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
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.xlsx"`);
    await workbook.xlsx.write(res);
    return res.end();
  }

  const escapeCell = (val) => `"${String(val).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.csv"`);
  res.status(200).send(csv);
}

// ────────────────────────────────────────────────────────
// GET /api/contacts/check-duplicate
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
// POST /api/contacts
// ────────────────────────────────────────────────────────
const createContact = asyncHandler(async (req, res) => {
  const contact = await Contact.create({
    ...req.body,
    owner: req.user.id,
    collectedBy: req.user.id,
  });

  res.status(201).json({ success: true, contact });

  // Sync to Zoho Bigin — fire-and-forget so a Bigin outage or slow
  // response never blocks or fails the contact save itself.
  upsertContactInBigin(contact).catch((err) => {
    console.error('Zoho Bigin sync failed (create) for contact', contact._id, err.response?.data || err.message);
  });
});

// ────────────────────────────────────────────────────────
// POST /api/contacts/:id/merge
// ────────────────────────────────────────────────────────
const mergeContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  const fields = ['name', 'company', 'designation', 'email', 'phone', 'website', 'address', 'event'];
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

  upsertContactInBigin(contact).catch((err) => {
    console.error('Zoho Bigin sync failed (merge) for contact', contact._id, err.response?.data || err.message);
  });
});

// ────────────────────────────────────────────────────────
// PUT /api/contacts/:id
// ────────────────────────────────────────────────────────
const updateContact = asyncHandler(async (req, res) => {
  let contact = await Contact.findOne({
    _id: req.params.id,
    ...applyContactScope(req),
  });

  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, contact });

  upsertContactInBigin(contact).catch((err) => {
    console.error('Zoho Bigin sync failed (update) for contact', contact._id, err.response?.data || err.message);
  });
});

// ────────────────────────────────────────────────────────
// DELETE /api/contacts/:id
// ────────────────────────────────────────────────────────
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    ...applyContactScope(req),
  });

  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  await contact.deleteOne();

  res.json({ success: true, message: 'Contact deleted.' });
});

// ────────────────────────────────────────────────────────
// POST /api/contacts/:id/notes
// ────────────────────────────────────────────────────────
const addNote = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    ...applyContactScope(req),
  });

  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
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
// POST /api/contacts/:id/reminders
// ────────────────────────────────────────────────────────
const addReminder = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    ...applyContactScope(req),
  });

  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  if (!req.body.dueDate) {
    return res.status(400).json({ success: false, message: 'Due date is required.' });
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

  const newReminder = contact.reminders[contact.reminders.length - 1];

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
    title: `${(req.body.task || 'follow_up').replace(/_/g, ' ')} - ${contact.name}`,
    description: req.body.note || '',
    priority: PRIORITY_MAP[req.body.priority] || 'Medium',
    taskType: TASK_TYPE_MAP[req.body.task] || 'Other',
    status: computedStatus,
    assignedEmployee: req.user.id,
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
// GET /api/contacts/reminders/today
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
// GET /api/contacts/reminders/all
// ────────────────────────────────────────────────────────
const getAllReminders = asyncHandler(async (req, res) => {
  const { filter = 'today' } = req.query;
  const userId = req.user.id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

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

  if (filter === 'today') {
    flattened = flattened.filter(
      (r) => r.status === 'pending' && new Date(r.dueDate) >= startOfDay && new Date(r.dueDate) <= endOfDay,
    );
  } else if (filter === 'upcoming') {
    flattened = flattened.filter((r) => r.status === 'pending' && new Date(r.dueDate) > endOfDay);
  } else if (filter === 'overdue') {
    flattened = flattened.filter((r) => r.status === 'pending' && new Date(r.dueDate) < startOfDay);
  } else if (filter === 'completed') {
    flattened = flattened.filter((r) => r.status === 'done');
  }

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
// PUT /api/contacts/:id/reminders/:reminderId
// ────────────────────────────────────────────────────────
const updateReminderStatus = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  const reminder = contact.reminders.id(req.params.reminderId);
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Reminder not found.' });
  }

  if (req.body.status) {
    reminder.status = req.body.status;
  }

  if (req.body.status === 'snoozed' && req.body.newDueDate) {
    reminder.dueDate = req.body.newDueDate;
  }

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