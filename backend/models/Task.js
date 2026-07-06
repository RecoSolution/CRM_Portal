import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    taskType: {
      type: String,
      enum: ['Follow-Up Call', 'Send Quotation', 'Meeting', 'Email', 'Reminder', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['Pending', 'Today', 'Upcoming', 'Overdue', 'Completed'],
      default: 'Pending',
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    dueTime: {
      type: String, // stored as 'HH:mm', kept separate from dueDate for easy display/edit
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    rescheduledAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    activityHistory: [
      {
        action: { type: String, required: true }, // e.g. 'created', 'reassigned', 'status_changed', 'rescheduled', 'note_added'
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        detail: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// ── Indexes for common queries ──────────────────────────
taskSchema.index({ assignedEmployee: 1, status: 1 });
taskSchema.index({ createdBy: 1, createdAt: -1 });
taskSchema.index({ contact: 1 });
taskSchema.index({ dueDate: 1 });

export default mongoose.model('Task', taskSchema);
