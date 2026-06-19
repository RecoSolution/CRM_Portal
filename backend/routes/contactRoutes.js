import express from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  addNote,
  addReminder,
  getTodayReminders,
} from '../controllers/contactController.js';
import { protect, verifiedOnly } from '../middleware/auth.js';

const router = express.Router();

// All contact routes need login + verified email
router.use(protect, verifiedOnly);

router.get('/reminders/today', getTodayReminders);

router.route('/').get(getContacts).post(createContact);

router.route('/:id').get(getContact).put(updateContact).delete(deleteContact);

router.post('/:id/notes', addNote);
router.post('/:id/reminders', addReminder);

export default router;
