import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { createOfflinePayment, getMyPayments, getPayments, updatePayment } from '../controllers/payments.controller';
import { validateBody } from '../utils/validate';
import { createOfflinePaymentSchema, updatePaymentSchema } from '../utils/validate';

const router = Router();
router.use(authenticate);
router.get('/mine', requireRole('COMPANY_ADMIN'), getMyPayments);
router.use(requireRole('SUPER_ADMIN'));
router.get('/', getPayments);
router.post('/offline', validateBody(createOfflinePaymentSchema), createOfflinePayment);
router.patch('/:id', validateBody(updatePaymentSchema), updatePayment);
export default router;
