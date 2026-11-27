import authController from '../controllers/auth.controller.js';
import {authMiddleware} from '../middleware/auth.js';
import express from 'express';
import { uploadAvatar } from '../middleware/upload.js';


const router = express.Router()

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware,authController.logout);
router.get('/getMe', authMiddleware, authController.getMe);
router.patch('/password', authMiddleware, authController.changePassword);
router.patch('/profile', authMiddleware, authController.updateProfile);
router.post('/avatar', authMiddleware, uploadAvatar , authController.updateAvatar);

export default router