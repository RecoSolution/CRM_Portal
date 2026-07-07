import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect, verifiedOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, verifiedOnly);
router.get('/', getAnalytics);

export default router;