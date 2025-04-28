import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { getBuyOrders, getMarketData, getSellOrders } from '../controllers/marketControllers.js';

const router = express.Router();

router.get('/:currency', verifyToken, getMarketData);
router.get('/:currency/buy', verifyToken, getBuyOrders);
router.get('/:currency/sell', verifyToken, getSellOrders);

export default router;