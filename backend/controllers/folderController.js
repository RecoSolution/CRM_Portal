import Folder from '../models/Folder.js';
import Contact from '../models/Contact.js';
import asyncHandler from '../utils/asyncHandler.js';

// @route   GET /api/folders
const getFolders = asyncHandler(async (req, res) => {
  const folders = await Folder.find({ owner: req.user.id }).sort({
    createdAt: -1,
  });

  // Get contact count per folder
  const foldersWithCount = await Promise.all(
    folders.map(async (folder) => {
      const count = await Contact.countDocuments({
        folder: folder._id,
        owner: req.user.id,
      });
      return { ...folder.toObject(), contactCount: count };
    }),
  );

  res.json({ success: true, folders: foldersWithCount });
});

// @route   POST /api/folders
const createFolder = asyncHandler(async (req, res) => {
  const existing = await Folder.findOne({
    owner: req.user.id,
    name: req.body.name,
  });
  if (existing) {
    return res
      .status(400)
      .json({
        success: false,
        message: 'Folder with this name already exists.',
      });
  }

  const folder = await Folder.create({
    name: req.body.name,
    color: req.body.color || '#15803d',
    owner: req.user.id,
  });

  res.status(201).json({ success: true, folder });
});

// @route   PUT /api/folders/:id
const updateFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { name: req.body.name, color: req.body.color },
    { new: true, runValidators: true },
  );

  if (!folder) {
    return res
      .status(404)
      .json({ success: false, message: 'Folder not found.' });
  }

  res.json({ success: true, folder });
});

// @route   DELETE /api/folders/:id
const deleteFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!folder) {
    return res
      .status(404)
      .json({ success: false, message: 'Folder not found.' });
  }

  // Unassign contacts from this folder (don't delete the contacts!)
  await Contact.updateMany({ folder: folder._id }, { folder: null });
  await folder.deleteOne();

  res.json({
    success: true,
    message: 'Folder deleted. Contacts moved to "No folder".',
  });
});

// @route   POST /api/folders/:id/add-contact
const addContactToFolder = asyncHandler(async (req, res) => {
  const { contactId } = req.body;

  const folder = await Folder.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });
  if (!folder) {
    return res
      .status(404)
      .json({ success: false, message: 'Folder not found.' });
  }

  const contact = await Contact.findOneAndUpdate(
    { _id: contactId, owner: req.user.id },
    { folder: folder._id },
    { new: true },
  );

  if (!contact) {
    return res
      .status(404)
      .json({ success: false, message: 'Contact not found.' });
  }

  res.json({ success: true, contact });
});

export {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  addContactToFolder,
};
