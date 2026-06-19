import express from 'express';
import { scanCard, generateAISummary } from '../controllers/scanController.js';
import { protect, verifiedOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect, verifiedOnly);

router.post('/ocr', upload.single('card'), scanCard);
router.post('/ai-summary', generateAISummary);

export default router;
