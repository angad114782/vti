import { Router } from 'express';
import { getTickets, getTicket, createTicket, updateTicket, getCompaniesForSupport } from '../controllers/support.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', getTickets);
router.get('/companies', getCompaniesForSupport);
router.get('/:id', getTicket);
router.post('/', createTicket);
router.patch('/:id', updateTicket);

export default router;
