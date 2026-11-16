import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';
import { orderExpiry } from '../middleware/orderExpiry.js';
import { pay, checkStatus, notification } from '../controllers/payment.controller.js';
import express from 'express';


const router = express.Router()

router.use(authMiddleware);
router.use(roleMiddleware('user'));

router.post('/:id/pay', orderExpiry, pay);
router.get('/:id/status', orderExpiry, checkStatus);

// mounted at /payment  ->  POST /payment/notification  (called by Midtrans, no JWT, protected by its signature)
export const webhookRoutes = express.Router();
webhookRoutes.post('/notification', notification);

export default router;
