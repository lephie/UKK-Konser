import { getAllConcert, getConcertById } from '../controllers/concert.controller.js';
import express from 'express';


const router = express.Router()

// public: anybody can browse published concerts
router.get('/', getAllConcert);
router.get('/:id', getConcertById);


export default router;

