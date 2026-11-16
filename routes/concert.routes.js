import { Router } from 'express';
import { getAllConcert, getConcertById } from '../controllers/concert.controller.js';

const router = Router();

// public: anybody can browse published concerts
router.get('/', getAllConcert);
router.get('/:id', getConcertById);

export default router;
