import express from 'express';
import {
  getTeam,
  getEmployeeDetail,
  getAllTeamContacts,
  assignLead,
  getAdminStats,
  getUnassignedContacts,
  getTeamDashboard,
} from '../controllers/adminController.js';
import { protect, requireFounder, verifiedOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require: logged in + verified + role=admin
router.use(protect, verifiedOnly, requireFounder);

router.get('/team', getTeam);
router.get('/team/:id', getEmployeeDetail);
router.get('/contacts', getAllTeamContacts);
router.post('/assign-lead', assignLead);
router.get('/stats', getAdminStats);
router.get('/unassigned-contacts', getUnassignedContacts);
router.get('/team-dashboard', getTeamDashboard);

export default router;
