import Contact from '../models/Contact.js';
import asyncHandler from '../utils/asyncHandler.js';

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

export { getDashboardStats };
