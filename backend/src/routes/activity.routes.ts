import { Router } from 'express';
import { getActivityLogs, getCompaniesFilter } from '../controllers/activity.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', getActivityLogs);
router.get('/companies', getCompaniesFilter);

export default router;
