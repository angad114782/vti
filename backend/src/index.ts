import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import connectDB from './utils/db';
import { errorHandler } from './core/errorHandler';

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

if (isProd && !process.env.CLIENT_URL) {
  console.error('Missing required env var in production: CLIENT_URL');
  process.exit(1);
}

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// ── App ─────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5001;

// Request ID — attached before all routes so it's available in error handler and logs
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  _res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Security headers
app.use(helmet());

// Compress responses
app.use(compression() as unknown as express.RequestHandler);

// Request logging
app.use(morgan(isProd ? 'combined' : 'dev'));

// CORS — reject unknown origins in all environments
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server requests (no Origin header) and the configured client
    if (!origin || origin === allowedOrigin) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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

// Liveness — is the process alive?
app.get('/api/health/live', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness — is the process ready to serve traffic?
app.get('/api/health/ready', (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Keep the legacy /api/health for backward compatibility with any existing monitors
app.get('/api/health', (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.json({ status: 'ok', db: dbOk ? 'connected' : 'disconnected', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Centralized error handler — must be last and have 4 params
app.use(errorHandler as (err: unknown, req: Request, res: Response, next: NextFunction) => void);

// ── Start ────────────────────────────────────────────────────────
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    const mongoHost = (process.env.MONGODB_URI || '').replace(/\/\/.*@/, '//<redacted>@');
    console.log(`[${isProd ? 'PROD' : 'DEV'}] Server running on http://localhost:${PORT}`);
    console.log(`[BOOT] CLIENT_URL (CORS origin) = ${process.env.CLIENT_URL || '(not set, defaulting to http://localhost:5173)'}`);
    console.log(`[BOOT] MONGODB_URI = ${mongoHost}`);
    console.log(`[BOOT] Connected DB name = ${mongoose.connection.name}`);
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
