import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { errorResponseHandler, invalidPathHandler } from './middleware/errorHandler.js';

import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import marketRoutes from './routes/marketRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(morgan("dev"));
app.use(cookieParser());

// API Routes
app.use('/api/auth', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/market', marketRoutes)

app.use(invalidPathHandler);
app.use(errorResponseHandler);

const PORT = process.env.PORT || 5000;

const server = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running in port ${PORT}`); 
        })
    } catch (error) {
        console.log(`Server error: ${error.message}`);
        process.exit(1);
    }
}

server();