import express, { Router } from 'express';
import authRoutes from './auth.routes';
import adminroutes from './admin.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminroutes)

export default router