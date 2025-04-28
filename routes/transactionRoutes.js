import express from 'express';
import { 
    createTransaction, 
    getUserTransactions, 
    getTransactionById,
    tradeCrypto
} from '../controllers/transactionControllers.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();


router.post('/', verifyToken, createTransaction);
router.get('/', verifyToken, getUserTransactions);
router.get('/:id', verifyToken, getTransactionById);
router.post('/trade', verifyToken, tradeCrypto);

export default router;