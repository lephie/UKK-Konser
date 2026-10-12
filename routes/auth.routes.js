import express, { Router } from 'express';
import authController from '../controllers/auth.controller';
import authService from '../services/auth.service';

const router = Router()

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/getMe', authController.getMe);

export default router