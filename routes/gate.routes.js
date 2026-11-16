import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';
import { eoApproved } from '../middleware/eoApproved.js';
import { scanTicket, getCheckinCount } from '../controllers/gate.controller.js';
import express from 'express';


const router = express.Router()

// the Event Organizer scans the tickets of his own concerts (no separate gate staff role)
router.use(authMiddleware);
router.use(roleMiddleware('event_organizer'));
router.use(eoApproved);

router.post('/scan', scanTicket);
router.get('/concerts/:id/count', getCheckinCount);

export default router;
