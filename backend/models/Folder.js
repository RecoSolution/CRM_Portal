import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    color: { type: String, default: '#15803d' },
  },
  { timestamps: true },
);

export default mongoose.model('Folder', folderSchema);
