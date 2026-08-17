import { Router } from 'express';
import { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } from '../controllers/companies.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateBody, createCompanySchema, updateCompanySchema } from '../utils/validate';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN'));

router.get('/', getCompanies);
router.get('/:id', getCompany);
router.post('/', validateBody(createCompanySchema), createCompany);
router.put('/:id', validateBody(updateCompanySchema), updateCompany);
router.delete('/:id', deleteCompany);

export default router;
