import express from 'express';
import { getDashboardStats, getHomeDashboard } from '../controllers/dashboardController.js';
import { protect, verifiedOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, verifiedOnly);

router.get('/stats', getDashboardStats);
router.get('/home', getHomeDashboard);

export default router;
