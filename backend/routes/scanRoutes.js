import express from 'express';
import {
  scanCard,
  generateAISummary,
  uploadVoiceNote,
  retryExtraction,
} from '../controllers/scanController.js';
import { protect, verifiedOnly } from '../middleware/auth.js';
import upload, { uploadAudio } from '../middleware/upload.js';

const router = express.Router();

router.use(protect, verifiedOnly);

router.post('/ocr', upload.single('card'), scanCard);
router.post('/upload-voice', uploadAudio.single('audio'), uploadVoiceNote);
router.post('/ai-summary', generateAISummary);
router.post('/retry-extraction', retryExtraction);

export default router;