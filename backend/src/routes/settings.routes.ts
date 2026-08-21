import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getPlatformSettings, updatePlatformSettings } from '../controllers/settings.controller';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));
router.get('/platform', getPlatformSettings);
router.put('/platform', updatePlatformSettings);
export default router;
