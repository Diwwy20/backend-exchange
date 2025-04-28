import express from 'express';
import { 
    getUserWallets, 
    getWalletByCurrency, 
    createWallet, 
    updateWalletBalance,
    transferFunds,
    getWalletStats
} from '../controllers/walletControllers.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', verifyToken, getUserWallets);
router.get('/:currency', verifyToken, getWalletByCurrency);
router.post('/', verifyToken, createWallet);
router.put('/balance', verifyToken, updateWalletBalance);
router.post('/transfer', verifyToken, transferFunds);
router.get('/stats/all', verifyToken,  getWalletStats);

export default router;