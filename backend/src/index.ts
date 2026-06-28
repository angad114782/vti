import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import connectDB from './utils/db';

import authRoutes from './routes/auth.routes';
import companiesRoutes from './routes/companies.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import activityRoutes from './routes/activity.routes';
import modulesRoutes from './routes/modules.routes';
import supportRoutes from './routes/support.routes';
import hrRoutes from './routes/hr.routes';
import financeRoutes from './routes/finance.routes';
import employeeRoutes from './routes/employee.routes';
import companyAdminRoutes from './routes/company-admin.routes';

// ── Env validation ──────────────────────────────────────────────
const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
const missing  = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';

// ── App ─────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5001;

// Security headers
app.use(helmet());

// Compress responses
app.use(compression() as unknown as express.RequestHandler);

// Request logging
app.use(morgan(isProd ? 'combined' : 'dev'));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
}));

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login',   authLimiter);
app.use('/api/auth/refresh', authLimiter);

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/companies',     companiesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/activity',      activityRoutes);
app.use('/api/modules',       modulesRoutes);
app.use('/api/support',       supportRoutes);
app.use('/api/hr',            hrRoutes);
app.use('/api/finance',       financeRoutes);
app.use('/api/employee',      employeeRoutes);
app.use('/api/company-admin', companyAdminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: isProd ? 'Internal server error' : err.message,
  });
});

// ── Start ────────────────────────────────────────────────────────
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[${isProd ? 'PROD' : 'DEV'}] Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`${signal} received – shutting down gracefully`);
    server.close(() => {
      mongoose.connection.close().then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});
