import authMiddleware from "../middleware/auth.js";
import roleMiddleware from "../middleware/role.js";
import { getMyTickets, getTicketById } from "../controllers/ticket.controller.js";
    import express from 'express';


    const router = express.Router()

router.use(authMiddleware);
router.use(roleMiddleware('user'));

router.get('/', getMyTickets);
router.get('/:id', getTicketById);

export default router;