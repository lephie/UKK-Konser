import express, { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminroutes from './admin.routes.js'
import concertRoutes from './concert.routes.js';

const router = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminroutes)
router.use('/concert', concertRoutes);


export default router