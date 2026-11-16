import { authMiddleware } from '../middleware/auth.js';
import {
    getNotification,
    getUnread,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../controllers/notification.controller.js';
import express from 'express';


const router = express.Router()

router.use(authMiddleware); // every role has notifications

router.get('/', getNotification);
router.get('/unread-count', getUnread);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
