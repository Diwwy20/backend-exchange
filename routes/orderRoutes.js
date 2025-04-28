import express from 'express';
import { 
    createOrder, 
    getOrders, 
    getUserOrders, 
    updateOrderStatus, 
    cancelOrder 
} from '../controllers/orderControllers.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, createOrder);
router.get('/', verifyToken, getOrders);
router.get('/user', verifyToken, getUserOrders);
router.put('/:id/status', verifyToken, updateOrderStatus);
router.put('/:id/cancel', verifyToken, cancelOrder);

export default router;