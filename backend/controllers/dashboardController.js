import Contact from '../models/Contact.js';
import asyncHandler from '../utils/asyncHandler.js';
import Task from '../models/Task.js';
import { applyRoleScope } from '../utils/authScope.js';

// ────────────────────────────────────────────────────────
// @route   GET /api/dashboard/stats
// @desc    Get dashboard stats for logged in user
// @access  Private
// ────────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalContacts,
    totalLeads,
    totalVendors,
    totalPartners,
    hotLeads,
    recentContacts,
    todayRemindersContacts,
  ] = await Promise.all([
    Contact.countDocuments({ owner: userId }),
    Contact.countDocuments({ owner: userId, relationshipType: 'lead' }),
    Contact.countDocuments({ owner: userId, relationshipType: 'vendor' }),
    Contact.countDocuments({ owner: userId, relationshipType: 'partner' }),
    Contact.countDocuments({ owner: userId, leadCategory: 'hot' }),
    Contact.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name company leadCategory createdAt'),
    Contact.find({
      owner: userId,
      'reminders.dueDate': { $gte: startOfDay, $lte: endOfDay },
      'reminders.status': 'pending',
    }).select('name company reminders'),
  ]);

  res.json({
    success: true,
    stats: {
      totalContacts,
      totalLeads,
      totalVendors,
      totalPartners,
      hotLeads,
    },
    recentContacts,
    todayReminders: todayRemindersContacts,
  });
});

// ────────────────────────────────────────────────────────
// @route   GET /api/dashboard/home
// @desc    Employee dashboard — own task snapshot (Founder sees org-wide)
// @access  Private
// ────────────────────────────────────────────────────────
export const getHomeDashboard = asyncHandler(async (req, res) => {
  const { scope } = req.query; // 'mine' forces personal tasks even for a Founder

  const taskQuery =
    scope === 'mine'
      ? { assignedEmployee: req.user.id }
      : applyRoleScope(req, {}, 'assignedEmployee');

  const [overdue, today, upcoming, completed, recentContacts, assignedCount, assignedContactsCount, unassignedContactsCount] =
    await Promise.all([
      Task.countDocuments({ ...taskQuery, status: 'Overdue' }),
      Task.countDocuments({ ...taskQuery, status: 'Today' }),
      Task.countDocuments({ ...taskQuery, status: 'Upcoming' }),
      Task.countDocuments({ ...taskQuery, status: 'Completed' }),
      Contact.find(req.user.role === 'founder' ? {} : { owner: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name company leadCategory createdAt'),
      Task.countDocuments(taskQuery),
      Contact.countDocuments({ assignedTo: req.user.id }),
      req.user.role === 'founder' ? Contact.countDocuments({ assignedTo: null }) : Promise.resolve(0),
    ]);

  res.json({
    success: true,
    tasks: { overdue, today, upcoming, completed },
    recentContacts,
    assignedCount,
    assignedContactsCount,
    unassignedContactsCount,
  });
});

export { getDashboardStats };
