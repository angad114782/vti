import { Router } from 'express';
import { getTickets, getTicket, createTicket, updateTicket, getCompaniesForSupport, getComments, addComment, getSupportAgents } from '../controllers/support.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'FINANCE', 'MANAGER', 'SUPERVISOR', 'EMPLOYEE'));

router.get('/', getTickets);
router.get('/companies', getCompaniesForSupport);
router.get('/agents', getSupportAgents);
router.get('/:id', getTicket);
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.post('/', createTicket);
router.patch('/:id', updateTicket);

export default router;
