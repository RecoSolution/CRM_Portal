import Notification from '../models/Notification.js';

// Lightweight fire-and-forget notification creator.
// No delivery channel wired yet (email/push/socket) — just persists
// the event so a future delivery layer or a `GET /api/notifications`
// endpoint can consume it without touching Task logic again.
const notify = async (recipientId, type, message, taskId = null) => {
  try {
    await Notification.create({ recipient: recipientId, type, message, task: taskId });
  } catch (err) {
    // Never let a notification failure break the main request
    console.error('Notification creation failed:', err.message);
  }
};

export default notify;