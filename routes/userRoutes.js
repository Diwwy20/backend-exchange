import express from 'express';
import { login, register, refreshToken, profile, logout, findUserByEmail } from '../controllers/userControllers.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// --- Public Route ---
router.post('/login', login);
router.post('/register', register); 
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// --- Protected Route ---
router.get("/profile", verifyToken, profile);
router.get('/find-by-email', verifyToken, findUserByEmail);

export default router;
