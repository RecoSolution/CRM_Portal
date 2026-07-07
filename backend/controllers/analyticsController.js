import Contact from '../models/Contact.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { applyContactScope, applyRoleScope } from '../utils/authScope.js';

// ────────────────────────────────────────────────────────
// @route   GET /api/analytics
// @desc    CRM usage analytics — role-aware (Founder vs Employee)
// @access  Private
// ────────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const isFounder = req.user.role === 'founder';
  const contactQuery = applyContactScope(req);
  const taskQuery = applyRoleScope(req, {}, 'assignedEmployee');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [
    totalContacts,
    contactsToday,
    contactsWeek,
    contactsMonth,
    contactsYear,
    hotLeads,
    warmLeads,
    coldLeads,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    dueTodayTasks,
    upcomingTasks,
    activeLeads,
    wonLeads,
    lostLeads,
    sourceBreakdown,
    monthlyGrowthRaw,
    contactsThisWeekForInsight,
    contactsPrevWeekForInsight,
  ] = await Promise.all([
    Contact.countDocuments(contactQuery),
    Contact.countDocuments({ ...contactQuery, createdAt: { $gte: todayStart } }),
    Contact.countDocuments({ ...contactQuery, createdAt: { $gte: weekStart } }),
    Contact.countDocuments({ ...contactQuery, createdAt: { $gte: monthStart } }),
    Contact.countDocuments({ ...contactQuery, createdAt: { $gte: yearStart } }),
    Contact.countDocuments({ ...contactQuery, leadCategory: 'hot' }),
    Contact.countDocuments({ ...contactQuery, leadCategory: 'warm' }),
    Contact.countDocuments({ ...contactQuery, leadCategory: 'cold' }),
    Task.countDocuments(taskQuery),
    Task.countDocuments({ ...taskQuery, status: 'Completed' }),
    Task.countDocuments({ ...taskQuery, status: { $ne: 'Completed' }, dueDate: null }),
    Task.countDocuments({ ...taskQuery, status: { $ne: 'Completed' }, dueDate: { $lt: todayStart } }),
    Task.countDocuments({ ...taskQuery, status: { $ne: 'Completed' }, dueDate: { $gte: todayStart, $lt: todayEnd } }),
    Task.countDocuments({ ...taskQuery, status: { $ne: 'Completed' }, dueDate: { $gte: todayEnd } }),
    Contact.countDocuments({ ...contactQuery, dealStatus: 'active' }),
    Contact.countDocuments({ ...contactQuery, dealStatus: 'won' }),
    Contact.countDocuments({ ...contactQuery, dealStatus: 'lost' }),
    Contact.aggregate([
      { $match: contactQuery },
      { $group: { _id: { $ifNull: ['$contactSource', 'scan'] }, count: { $sum: 1 } } },
    ]),
    Contact.aggregate([
      { $match: { ...contactQuery, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Contact.countDocuments({ ...contactQuery, createdAt: { $gte: sevenDaysAgo } }),
    Contact.countDocuments({ ...contactQuery, createdAt: { $gte: prevWeekStart, $lt: weekStart } }),
  ]);

  const conversionRate = wonLeads + lostLeads > 0
    ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100)
    : 0;

  const sourceMap = { scan: 0, manual: 0, import: 0 };
  sourceBreakdown.forEach((s) => { sourceMap[s._id] = s.count; });

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const match = monthlyGrowthRaw.find(
      (m) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1
    );
    monthlyGrowth.push({ label: monthNames[d.getMonth()], count: match ? match.count : 0 });
  }

  // ── Role-specific section ──────────────────────
  let employeePerformance = null;
  let personalPerformance = null;

  if (isFounder) {
    const employees = await User.find({ role: 'employee' }).select('firstName lastName');
    employeePerformance = await Promise.all(
      employees.map(async (emp) => {
        const [contactsAdded, tasksCompleted, pendingCount, overdueCount] = await Promise.all([
          Contact.countDocuments({ owner: emp._id }),
          Task.countDocuments({ assignedEmployee: emp._id, status: 'Completed' }),
          Task.countDocuments({ assignedEmployee: emp._id, status: { $ne: 'Completed' }, dueDate: null }),
          Task.countDocuments({ assignedEmployee: emp._id, status: { $ne: 'Completed' }, dueDate: { $lt: todayStart } }),
        ]);
        return {
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          contactsAdded,
          tasksCompleted,
          pendingTasks: pendingCount,
          overdueTasks: overdueCount,
          score: contactsAdded + tasksCompleted * 2 - overdueCount,
        };
      })
    );
    employeePerformance.sort((a, b) => b.score - a.score);
  } else {
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await Contact.countDocuments({
        owner: req.user.id,
        createdAt: { $gte: dayStart, $lt: dayEnd },
      });
      weeklyActivity.push({
        label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }
    personalPerformance = {
      myContacts: totalContacts,
      myCompletedTasks: completedTasks,
      myPendingTasks: pendingTasks,
      myOverdueTasks: overdueTasks,
      weeklyActivity,
    };
  }

  // ── Recent activity (from Task history, most recent first) ──
  const recentTasks = await Task.find(taskQuery)
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('title activityHistory contact')
    .populate('contact', 'name');

  const recentActivity = [];
  recentTasks.forEach((t) => {
    const lastEntry = t.activityHistory[t.activityHistory.length - 1];
    if (lastEntry) {
      recentActivity.push({
        action: lastEntry.action,
        detail: lastEntry.detail,
        contactName: t.contact?.name || null,
        timestamp: lastEntry.timestamp,
      });
    }
  });
  const recentContactsForActivity = await Contact.find(contactQuery)
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name createdAt');
  recentContactsForActivity.forEach((c) => {
    recentActivity.push({
      action: 'contact_added',
      detail: `Contact added: ${c.name}`,
      contactName: c.name,
      timestamp: c.createdAt,
    });
  });
  recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // ── Quick insights (simple generated strings) ──
  const insights = [];
  insights.push(`You added ${contactsThisWeekForInsight} contact${contactsThisWeekForInsight === 1 ? '' : 's'} this week.`);
  if (contactsPrevWeekForInsight > 0) {
    const change = Math.round(((contactsThisWeekForInsight - contactsPrevWeekForInsight) / contactsPrevWeekForInsight) * 100);
    if (change !== 0) {
      insights.push(`Contacts added ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}% vs last week.`);
    }
  }
  if (overdueTasks > 0) {
    insights.push(`${overdueTasks} task${overdueTasks === 1 ? ' is' : 's are'} overdue.`);
  }
  const avgPerDay = totalContacts > 0 && contactsMonth > 0 ? (contactsMonth / now.getDate()).toFixed(1) : '0';
  insights.push(`Average ${avgPerDay} new contact${avgPerDay === '1.0' ? '' : 's'} per day this month.`);

  res.json({
    success: true,
    contactStats: {
      total: totalContacts,
      today: contactsToday,
      week: contactsWeek,
      month: contactsMonth,
      year: contactsYear,
    },
    leadQuality: { hot: hotLeads, warm: warmLeads, cold: coldLeads },
    taskStats: {
      total: totalTasks,
      pending: pendingTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      dueToday: dueTodayTasks,
      upcoming: upcomingTasks,
    },
    businessPerformance: { conversionRate, activeLeads, lostLeads, wonLeads },
    contactSources: sourceMap,
    monthlyGrowth,
    employeePerformance,
    personalPerformance,
    recentActivity: recentActivity.slice(0, 15),
    insights,
  });
});

export { getAnalytics };