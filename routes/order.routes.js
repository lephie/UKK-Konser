import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';
import { orderExpiry } from '../middleware/orderExpiry.js';
import { createOrder, getMyOrders, getOrderById, cancelOrder } from '../controllers/order.controller.js';
import express from 'express';


const router = express.Router()

router.use(authMiddleware);
router.use(roleMiddleware('user'));

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', orderExpiry, getOrderById);
router.post('/:id/cancel', orderExpiry, cancelOrder);

export default router;
