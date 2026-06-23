import express from 'express';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  addContactToFolder,
} from '../controllers/folderController.js';
import { protect, verifiedOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, verifiedOnly);

router.route('/').get(getFolders).post(createFolder);

router.route('/:id').put(updateFolder).delete(deleteFolder);

router.post('/:id/add-contact', addContactToFolder);

export default router;
