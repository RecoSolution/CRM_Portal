import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'voice'], default: 'text' },
    audioUrl: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const reminderSchema = new mongoose.Schema(
  {
    dueDate: { type: Date, required: true },
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'done', 'snoozed'],
      default: 'pending',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const contactSchema = new mongoose.Schema(
  {
    // ── Owner ───────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Basic Contact Info ──────────────────
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    company: { type: String, trim: true, default: '' },
    designation: { type: String, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },

    // ── Classification ──────────────────────
    relationshipType: {
      type: String,
      enum: [
        'lead',
        'vendor',
        'customer',
        'partner',
        'team',
        'investor',
        'general',
        '',
      ],
      default: 'lead',
      set: (v) => v || 'lead',
    },
    category: { type: String, default: '' },
    tags: [{ type: String }],

    // ── Event Info ──────────────────────────
    event: { type: String, default: '' },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ── Card Image ──────────────────────────
    cardImageUrl: { type: String, default: '' },

    // ── AI Fields ───────────────────────────
    aiSummary: { type: String, default: '' },
    leadScore: { type: Number, min: 0, max: 100, default: 0 },
    leadCategory: {
      type: String,
      enum: ['hot', 'warm', 'cold', ''],
      default: '',
    },

    // ── Notes & Reminders ──────────────────
    notes: [noteSchema],
    reminders: [reminderSchema],

    // ── Follow-up ───────────────────────────
    followUpStatus: {
      type: String,
      enum: ['pending', 'done', 'skipped'],
      default: 'pending',
    },

    currentStage: {
      type: String,
      enum: [
        'new_contact',
        'follow_up_due',
        'negotiation',
        'quotation_sent',
        'quotation_pending',
        'closed',
        '',
      ],
      default: 'new_contact',
      set: (v) => v || 'new_contact',
    },

    // ── Folder ──────────────────────────────
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },

    // ── Team Assignment ─────────────────────
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

// Index for fast searching
contactSchema.index({ owner: 1, createdAt: -1 });
contactSchema.index({ name: 'text', company: 'text', email: 'text' });

export default mongoose.model('Contact', contactSchema);
