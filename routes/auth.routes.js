import authController from '../controllers/auth.controller.js';
import {authMiddleware} from '../middleware/auth.js';
import express from 'express';


const router = express.Router()

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware,authController.logout);
router.get('/getMe', authMiddleware, authController.getMe);
router.patch('/password', authMiddleware, authController.changePassword);

export default router