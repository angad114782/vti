import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getDashboard,
  getUsers, createUser, updateUser, deleteUser,
  getDepartments,
  getCompany, updateCompany,
  getModules, toggleModule,
  getActivity,
} from '../controllers/company-admin.controller';

const router = Router();

const access = requireRole('COMPANY_ADMIN', 'SUPER_ADMIN');
router.use(authenticate, access);

router.get('/dashboard',           getDashboard);
router.get('/users',               getUsers);
router.post('/users',              createUser);
router.patch('/users/:id',         updateUser);
router.delete('/users/:id',        deleteUser);
router.get('/departments',         getDepartments);
router.get('/company',             getCompany);
router.patch('/company',           updateCompany);
router.get('/modules',             getModules);
router.patch('/modules/:moduleId', toggleModule);
router.get('/activity',            getActivity);

export default router;
