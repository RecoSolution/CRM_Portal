import express from 'express';
import {
  getTeam,
  getAllTeamContacts,
  assignLead,
  getAdminStats,
} from '../controllers/adminController.js';
import { protect, adminOnly, verifiedOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require: logged in + verified + role=admin
router.use(protect, verifiedOnly, adminOnly);

router.get('/team', getTeam);
router.get('/contacts', getAllTeamContacts);
router.post('/assign-lead', assignLead);
router.get('/stats', getAdminStats);

export default router;
