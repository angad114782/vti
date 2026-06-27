import { Router } from 'express';
import { getSubscriptions, getPlans, assignPlan, updateSubscription } from '../controllers/subscriptions.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', getSubscriptions);
router.get('/plans', getPlans);
router.post('/assign', assignPlan);
router.put('/:id', updateSubscription);

export default router;
