import express, { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminroutes from './admin.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminroutes)


export default router