import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import eoRoutes from './eo.routes.js';
import concertRoutes from './concert.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes, { webhookRoutes } from './payment.routes.js';
import ticketRoutes from './ticket.routes.js';
import gateRoutes from './gate.routes.js';
import notificationRoutes from './notification.routes.js';
import express from 'express';


const router = express.Router()

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/eo', eoRoutes);
router.use('/concerts', concertRoutes);
router.use('/orders', orderRoutes);
router.use('/orders', paymentRoutes); // /orders/:id/pay and /orders/:id/status
router.use('/payment', webhookRoutes); // Midtrans webhook
router.use('/tickets', ticketRoutes);
router.use('/gate', gateRoutes);
router.use('/notifications', notificationRoutes);

export default router