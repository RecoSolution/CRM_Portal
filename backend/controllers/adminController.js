import User from '../models/User.js';
import Contact from '../models/Contact.js';
import asyncHandler from '../utils/asyncHandler.js';
import Task from '../models/Task.js';

// @route   GET /api/admin/team
// @desc    Get all team members with their contact counts
const getTeam = asyncHandler(async (req, res) => {
  const users = await User.find({}).select(
    'firstName lastName email role jobTitle createdAt',
  );

  const team = await Promise.all(
    users.map(async (user) => {
      const contactCount = await Contact.countDocuments({ owner: user._id });
      const activeTaskCount = await Task.countDocuments({
        assignedEmployee: user._id,
        status: { $ne: 'Completed' },
      });
      const completedTaskCount = await Task.countDocuments({
        assignedEmployee: user._id,
        status: 'Completed',
      });
      return {
        ...user.toObject(),
        contactCount,
        activeTaskCount,
        completedTaskCount,
      };
    }),
  );

  res.json({ success: true, team });
});

// @route   GET /api/admin/team/:id
// @desc    Single employee detail — contacts + task breakdown (Founder only)
const getEmployeeDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'firstName lastName email role jobTitle createdAt',
  );
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: 'Employee not found.' });
  }

  const [contactCount, tasksByStatus] = await Promise.all([
    Contact.countDocuments({ owner: user._id }),
    Task.aggregate([
      { $match: { assignedEmployee: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const taskStatusBreakdown = tasksByStatus.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  res.json({
    success: true,
    employee: user,
    contactCount,
    taskStatusBreakdown,
  });
});

// @route   GET /api/admin/contacts
// @desc    Get ALL contacts across all team members (admin view)
const getAllTeamContacts = asyncHandler(async (req, res) => {
  const { search, type, ownerId, page = 1, limit = 20 } = req.query;

  const query = {};
  if (type) query.relationshipType = type;
  if (ownerId) query.owner = ownerId;
  if (search) query.$text = { $search: search };

  const skip = (page - 1) * limit;
  const total = await Contact.countDocuments(query);

  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('owner', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    contacts,
  });
});

// @route   POST /api/admin/assign-lead
// @desc    Assign a contact/lead to a team member
const assignLead = asyncHandler(async (req, res) => {
  const { contactId, assignToUserId } = req.body;

  const assignee = await User.findById(assignToUserId);
  if (!assignee) {
    return res
      .status(404)
      .json({ success: false, message: 'Team member not found.' });
  }

  const contact = await Contact.findByIdAndUpdate(
    contactId,
    { assignedTo: assignToUserId },
    { new: true },
  ).populate('assignedTo', 'firstName lastName email');

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  res.json({ success: true, contact });
});

// @route   GET /api/admin/stats
// @desc    Org-wide stats for admin dashboard
const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalContacts, hotLeads, totalVendors, totalPartners] =
    await Promise.all([
      User.countDocuments({}),
      Contact.countDocuments({}),
      Contact.countDocuments({ leadCategory: 'hot' }),
      Contact.countDocuments({ relationshipType: 'vendor' }),
      Contact.countDocuments({ relationshipType: 'partner' }),
    ]);

  res.json({
    success: true,
    stats: { totalUsers, totalContacts, hotLeads, totalVendors, totalPartners },
  });
});

// @route   GET /api/admin/unassigned-contacts
// @desc    Contacts not yet assigned to any employee (Founder only)
const getUnassignedContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = { assignedTo: null };

  const skip = (page - 1) * limit;
  const total = await Contact.countDocuments(query);

  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('owner', 'firstName lastName email');

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    contacts,
  });
});

// @route   GET /api/admin/team-dashboard
// @desc    Founder's team-wide task statistics across all employees
const getTeamDashboard = asyncHandler(async (req, res) => {
  const [taskStatusBreakdown, totalTasks, unassignedContactsCount] =
    await Promise.all([
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.countDocuments({}),
      Contact.countDocuments({ assignedTo: null }),
    ]);

  const statusMap = taskStatusBreakdown.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  res.json({
    success: true,
    totalTasks,
    taskStatusBreakdown: statusMap,
    unassignedContactsCount,
  });
});

export {
  getTeam,
  getEmployeeDetail,
  getAllTeamContacts,
  assignLead,
  getAdminStats,
  getUnassignedContacts,
  getTeamDashboard,
};
