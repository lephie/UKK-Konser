import authMiddleware from "../middleware/auth.js";
import roleMiddleware from "../middleware/role.js";
import eoApproved from "../middleware/eoApproved.js";
import { getAttendees, getConcertOrder, getConcertReport, getProfile, updateProfile } from "../controllers/eo.controller.js";
import { getDashboard } from "../controllers/eo.controller.js";
import { cancelConcert, createConcert, deleteConcert, getMyConcert, getMyConcertById, publishConcert, updateConcert } from "../controllers/concert.controller.js";
import { createTier, deleteTier, getTiers, updateTier } from "../controllers/ticketTier.controller.js";
import express from 'express';


const router = express.Router()

router.use(authMiddleware);
router.use(roleMiddleware('event_organizer'));
router.use(eoApproved);

// profile n dasbo
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', getDashboard);

//concers
router.post('/concerts', createConcert);
router.get('/concerts', getMyConcert);
router.get('/concerts/:id', getMyConcertById);
router.put('/concerts/:id', updateConcert);
router.delete('/concerts/:id', deleteConcert)
router.patch('/concerts/:id/publish', publishConcert);
router.patch('/concerts/:id/cancel', cancelConcert);

//tiet pier
router.post('/concerts/:concertId/tiers', createTier);
router.get('/concerts/:concertId/tiers', getTiers);
router.put('/tiers/:id', updateTier);
router.delete('/tiers/:id', deleteTier);

//order dll
router.get('/concerts/:id/orders', getConcertOrder);
router.get('/concerts/:id/attendees', getAttendees);
router.get('/concerts/:id/report', getConcertReport);

export default router