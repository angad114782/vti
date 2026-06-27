import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/company-admin', companyAdminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
