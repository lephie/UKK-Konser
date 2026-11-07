import express, { Router } from 'express';

import authService from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.js';
import roleMiddleware from '../middleware/role.js';
import { approveEO, getAllConcert, getAllEO, getAllUser, rejectEO, removeConcert, statusUser } from '../controllers/admin.controller.js';

const router = Router()

router.use(authMiddleware);
router.use(roleMiddleware('superadmin'));

router.get('/users', getAllUser);
router.patch('/users/:id/status', statusUser)

router.get('/eo', getAllEO)
router.patch('/eo/:id/approve', approveEO)
router.patch('/eo/:id/reject', rejectEO)

router.get('/concert', getAllConcert)
router.delete('/concert/:id', removeConcert)

export default router
