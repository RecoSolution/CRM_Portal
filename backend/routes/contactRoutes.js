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
  checkDuplicate,
  mergeContact,
  updateReminderStatus,
  getAllReminders,
  exportContacts
} from '../controllers/contactController.js';
import { protect, verifiedOnly } from '../middleware/auth.js';

const router = express.Router();

// All contact routes need login + verified email
router.use(protect, verifiedOnly);

router.get('/reminders/all', getAllReminders)
router.get('/reminders/today', getTodayReminders);
router.get('/check-duplicate', checkDuplicate);
router.get('/export', exportContacts);

router.route('/').get(getContacts).post(createContact);

router.route('/:id').get(getContact).put(updateContact).delete(deleteContact);

router.post('/:id/notes', addNote);
router.post('/:id/reminders', addReminder);
router.post('/:id/merge', mergeContact);
router.put('/:id/reminders/:reminderId', updateReminderStatus);

export default router;
