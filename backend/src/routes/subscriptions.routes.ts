import { Router } from 'express';
import { getSubscriptions, getPlans, createPlan, updatePlan, deletePlan, assignPlan, updateSubscription, getRevenueTrend } from '../controllers/subscriptions.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody, createPlanSchema, updatePlanSchema, assignPlanSchema, updateSubscriptionSchema } from '../utils/validate';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', getSubscriptions);
router.get('/plans', getPlans);
router.post('/plans', validateBody(createPlanSchema), createPlan);
router.put('/plans/:id', validateBody(updatePlanSchema), updatePlan);
router.delete('/plans/:id', deletePlan);
router.post('/assign', validateBody(assignPlanSchema), assignPlan);
router.get('/revenue-trend', getRevenueTrend);
router.put('/:id', validateBody(updateSubscriptionSchema), updateSubscription);

export default router;
