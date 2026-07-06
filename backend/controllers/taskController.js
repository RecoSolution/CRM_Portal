import Task from '../models/Task.js';
import asyncHandler from '../utils/asyncHandler.js';
import { applyRoleScope, canAccessRecord } from '../utils/authScope.js';
import User from '../models/User.js';
import notify from '../utils/notify.js';
import Contact from '../models/Contact.js';

const POPULATE_FIELDS = [
  { path: 'assignedEmployee', select: 'firstName lastName email' },
  { path: 'createdBy', select: 'firstName lastName email' },
  { path: 'contact', select: 'name company email phone' },
];

// ────────────────────────────────────────────────────────
// @route   GET /api/tasks
// @desc    List tasks — Founder sees all, Employee sees only assigned
// @access  Private
// ────────────────────────────────────────────────────────
const getTasks = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    taskType,
    assignedEmployee,
    contact,
    relationshipType, // filter by the related contact's relationship type
    filter, // quick shortcut: 'overdue' | 'today' | 'upcoming' | 'completed' | 'pending'
    dueFrom, // date-range start (ISO string)
    dueTo, // date-range end (ISO string)
    page = 1,
    limit = 20,
  } = req.query;

  let query = applyRoleScope(req, {}, 'assignedEmployee');

  // Quick-filter shortcut maps directly onto the status enum
  const FILTER_STATUS_MAP = {
    overdue: 'Overdue',
    today: 'Today',
    upcoming: 'Upcoming',
    completed: 'Completed',
    pending: 'Pending',
  };
  if (filter && FILTER_STATUS_MAP[filter]) {
    query.status = FILTER_STATUS_MAP[filter];
  } else if (status) {
    query.status = status;
  }

  if (priority) query.priority = priority;
  if (taskType) query.taskType = taskType;
  if (contact) query.contact = contact;

  // Relationship type lives on Contact, not Task — do a lookup rather
  // than duplicating the field, so it never goes out of sync.
  if (relationshipType) {
    const matchingContacts = await Contact.find({
      relationshipType: relationshipType.toLowerCase(),
    }).select('_id');
    query.contact = { $in: matchingContacts.map((c) => c._id) };
  }
  // Founder can further filter by a specific employee
  if (assignedEmployee && req.user.role === 'founder') {
    query.assignedEmployee = assignedEmployee;
  }

  // Due date range filter
  if (dueFrom || dueTo) {
    query.dueDate = {};
    if (dueFrom) query.dueDate.$gte = new Date(dueFrom);
    if (dueTo) query.dueDate.$lte = new Date(dueTo);
  }

  const skip = (page - 1) * limit;
  const total = await Task.countDocuments(query);

  const tasks = await Task.find(query)
    .sort({ dueDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate(POPULATE_FIELDS);

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    tasks,
  });
});

// ────────────────────────────────────────────────────────
// @route   GET /api/tasks/:id
// @access  Private
// ────────────────────────────────────────────────────────
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate(POPULATE_FIELDS);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }
  if (!canAccessRecord(req, task, 'assignedEmployee')) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  res.json({ success: true, task });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/tasks
// @desc    Create a task — Founder only
// @access  Private (founder)
// ────────────────────────────────────────────────────────
const createTask = asyncHandler(async (req, res) => {
const {
    title,
    description,
    priority,
    taskType,
    assignedEmployee,
    contact,
    dueDate,
    dueTime,
    notes,
  } = req.body;

  if (!title || !assignedEmployee) {
    return res.status(400).json({
      success: false,
      message: 'Title and assignedEmployee are required.',
    });
  }

 const task = await Task.create({
    title,
    description,
    priority,
    taskType,
    assignedEmployee,
    contact,
    dueDate,
    dueTime,
    notes,
    createdBy: req.user.id,
    activityHistory: [
      {
        action: 'created',
        performedBy: req.user.id,
        detail: `Task created and assigned.`,
      },
    ],
  });

  const populated = await task.populate(POPULATE_FIELDS);
  await notify(
    assignedEmployee,
    'task_assigned',
    `New task assigned: "${title}"`,
    task._id,
  );
  res.status(201).json({ success: true, task: populated });
});

// ────────────────────────────────────────────────────────
// @route   PUT /api/tasks/:id
// @desc    Edit task — Founder only (full edit rights)
// @access  Private (founder)
// ────────────────────────────────────────────────────────
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  const { reason } = req.body;
  const editableFields = [
    'title',
    'description',
    'priority',
    'taskType',
    'assignedEmployee',
    'contact',
    'dueDate',
    'dueTime',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  let detail = 'Task details edited.';
  if (reason) detail += ` Reason: ${reason}`;

  task.activityHistory.push({
    action: 'updated',
    performedBy: req.user.id,
    detail,
  });

  await task.save();
  const populated = await task.populate(POPULATE_FIELDS);
  res.json({ success: true, task: populated });
});

// ────────────────────────────────────────────────────────
// @route   DELETE /api/tasks/:id
// @desc    Delete task — Founder only
// @access  Private (founder)
// ────────────────────────────────────────────────────────
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }
  res.json({ success: true, message: 'Task deleted.' });
});

// ────────────────────────────────────────────────────────
// @route   PUT /api/tasks/:id/status
// @desc    Update task status — Founder or assigned Employee
// @access  Private
// ────────────────────────────────────────────────────────
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = [
    'Pending',
    'Today',
    'Upcoming',
    'Overdue',
    'Completed',
  ];

  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid status value.' });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }
  if (!canAccessRecord(req, task, 'assignedEmployee')) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  task.status = status;
  if (status === 'Completed') task.completedAt = new Date();

  if (status === 'Completed') {
    await notify(
      task.createdBy,
      'task_completed',
      `Task "${task.title}" was marked completed.`,
      task._id,
    );
  }

  task.activityHistory.push({
    action: 'status_changed',
    performedBy: req.user.id,
    detail: `Status changed to ${status}.`,
  });

  await task.save();
  const populated = await task.populate(POPULATE_FIELDS);
  res.json({ success: true, task: populated });
});

// ────────────────────────────────────────────────────────
// @route   PUT /api/tasks/:id/reschedule
// @desc    Reschedule task — Founder or assigned Employee
// @access  Private
// ────────────────────────────────────────────────────────
const rescheduleTask = asyncHandler(async (req, res) => {
  const { dueDate, dueTime, reason } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }
  if (!canAccessRecord(req, task, 'assignedEmployee')) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  if (dueDate) task.dueDate = dueDate;
  if (dueTime) task.dueTime = dueTime;
  task.rescheduledAt = new Date();
  task.status = 'Upcoming';

  let detail = `Rescheduled to ${dueDate || task.dueDate}${dueTime ? ' ' + dueTime : ''}.`;
  if (reason) detail += ` Reason: ${reason}`;

  task.activityHistory.push({
    action: 'rescheduled',
    performedBy: req.user.id,
    detail,
  });

  await task.save();
  const populated = await task.populate(POPULATE_FIELDS);
  res.json({ success: true, task: populated });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/tasks/:id/notes
// @desc    Add/append a note — Founder or assigned Employee
// @access  Private
// ────────────────────────────────────────────────────────
const addTaskNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  if (!note) {
    return res
      .status(400)
      .json({ success: false, message: 'Note text is required.' });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }
  if (!canAccessRecord(req, task, 'assignedEmployee')) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  task.notes = task.notes ? `${task.notes}\n${note}` : note;
  task.activityHistory.push({
    action: 'note_added',
    performedBy: req.user.id,
    detail: note,
  });

  await task.save();
  const populated = await task.populate(POPULATE_FIELDS);
  res.json({ success: true, task: populated });
});

// ────────────────────────────────────────────────────────
// @route   PUT /api/tasks/:id/assign
// @desc    Assign or reassign a task to an employee — Founder only
// @access  Private (founder)
// ────────────────────────────────────────────────────────
const assignTask = asyncHandler(async (req, res) => {
  const { assignedEmployee } = req.body;

  if (!assignedEmployee) {
    return res.status(400).json({
      success: false,
      message: 'assignedEmployee is required.',
    });
  }

  const employee = await User.findById(assignedEmployee);
  if (!employee) {
    return res
      .status(404)
      .json({ success: false, message: 'Employee not found.' });
  }
  if (employee.role !== 'employee') {
    return res.status(400).json({
      success: false,
      message: 'Tasks can only be assigned to users with the employee role.',
    });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  const previousEmployee = task.assignedEmployee?.toString();
  task.assignedEmployee = assignedEmployee;

  await notify(
    assignedEmployee,
    'task_reassigned',
    `Task "${task.title}" was assigned to you.`,
    task._id,
  );

  task.activityHistory.push({
    action: 'reassigned',
    performedBy: req.user.id,
    detail: previousEmployee
      ? `Reassigned from ${previousEmployee} to ${assignedEmployee}.`
      : `Assigned to ${assignedEmployee}.`,
  });

  await task.save();
  const populated = await task.populate(POPULATE_FIELDS);
  res.json({ success: true, task: populated });
});

// ────────────────────────────────────────────────────────
// @route   GET /api/tasks/:id/history
// @desc    Get full activity history for a task
// @access  Private (Founder: any task, Employee: only assigned)
// ────────────────────────────────────────────────────────
const getTaskHistory = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .select('title activityHistory assignedEmployee')
    .populate('activityHistory.performedBy', 'firstName lastName email role');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }
  if (!canAccessRecord(req, task, 'assignedEmployee')) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  // Most recent activity first
  const history = [...task.activityHistory].sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  res.json({
    success: true,
    taskId: task._id,
    taskTitle: task.title,
    history,
  });
});

export {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  rescheduleTask,
  addTaskNote,
  assignTask,
  getTaskHistory,
};
