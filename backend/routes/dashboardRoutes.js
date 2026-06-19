import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, verifiedOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, verifiedOnly);

router.get('/stats', getDashboardStats);

export default router;
