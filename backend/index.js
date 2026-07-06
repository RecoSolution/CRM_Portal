import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

// ── Connect to MongoDB ───────────────────────────────────
connectDB();

const app = express();

// ── Security Middleware ──────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [
      'https://recosolution.vercel.app',
      'http://localhost:5173'
    ],
    credentials: true,
  })
);

// ── Rate Limiting (prevent abuse) ────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      process.env.NODE_ENV === 'production' ? 100 : 10000,
  message:  { success: false, message: 'Too many requests. Try again later.' },
})
app.use('/api', limiter)

// Auth routes stricter limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  message: {
    success: false,
    message: 'Too many attempts. Try again in 15 minutes.',
  },
});
app.use('/api/auth', authLimiter);

// ── Body Parser ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logger (dev only) ────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'RecoSolution API is running ✅' });
});

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler (must be last) ──────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`,
  );
});
