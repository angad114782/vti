import { Router } from 'express';
import { login, logout, refreshToken, getMe, updateMe, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { getMyAccess } from '../controllers/access.controller';
import { validateBody, loginSchema, changePasswordSchema, refreshTokenSchema, updateProfileSchema } from '../utils/validate';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', validateBody(refreshTokenSchema), refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.get('/access', authenticate, getMyAccess);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateMe);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);

export default router;
