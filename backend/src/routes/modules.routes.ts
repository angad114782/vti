import { Router } from 'express';
import { getModules, getCompaniesForModules, toggleModule, getPermissions, updatePermission } from '../controllers/modules.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', getModules);
router.get('/companies', getCompaniesForModules);
router.put('/toggle', toggleModule);
router.get('/permissions', getPermissions);
router.put('/permissions', updatePermission);

export default router;
