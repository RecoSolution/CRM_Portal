import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  rescheduleTask,
  addTaskNote,
  assignTask,
  getTaskHistory,
} from '../controllers/taskController.js';
import { protect, verifiedOnly, requireFounder } from '../middleware/auth.js';

const router = express.Router();

// All task routes require: logged in + verified
router.use(protect, verifiedOnly);

// ── Shared (Founder sees all, Employee sees own — enforced in controller) ──
router.get('/', getTasks);
router.get('/:id', getTask);
router.get('/:id/history', getTaskHistory);

// ── Founder only ─────────────────────────────
router.post('/', requireFounder, createTask);
router.put('/:id', requireFounder, updateTask);
router.delete('/:id', requireFounder, deleteTask);
router.put('/:id/assign', requireFounder, assignTask);

// ── Founder or assigned Employee (enforced via canAccessRecord in controller) ──
router.put('/:id/status', updateTaskStatus);
router.put('/:id/reschedule', rescheduleTask);
router.post('/:id/notes', addTaskNote);

export default router;
