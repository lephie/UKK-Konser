
import { authMiddleware } from '../middleware/auth.js';
import roleMiddleware from '../middleware/role.js';
import { approveEO, createEO, getAllConcert, getAllEO, getAllOrders, getAllUser, getDashboard, rejectEO, removeConcert, statusUser } from '../controllers/admin.controller.js';
import express from 'express';


const router = express.Router()

router.use(authMiddleware);
router.use(roleMiddleware('superadmin'));

router.get('/dashboard', getDashboard);

router.get('/users', getAllUser);
router.patch('/users/:id/status', statusUser);

router.get('/eo', getAllEO);
router.post('/eo', createEO);
router.patch('/eo/:id/approve', approveEO);
router.patch('/eo/:id/reject', rejectEO);

router.get('/concert', getAllConcert);
router.delete('/concert/:id', removeConcert);

router.get('/orders', getAllOrders);

export default router
