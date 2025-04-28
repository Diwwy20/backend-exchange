import prisma from "../config/prisma.config.js";
import { WalletRepository } from "../repositories/walletRepository.js";

// Get user's wallets
export const getUserWallets = async (req, res, next) => {
    const userId = req.userId;
    
    try {
        const wallets = await prisma.wallets.findMany({
            where: {
                userId
            }
        });
        
        res.status(200).send({
            success: true,
            wallets
        });
    } catch (error) {
        next(error);
    }
};

// Get wallet by currency
export const getWalletByCurrency = async (req, res, next) => {
    const userId = req.userId;
    const { currency } = req.params;
    
    try {
        const wallet = await prisma.wallets.findFirst({
            where: {
                userId,
                currency
            }
        });
        
        if (!wallet) {
            return res.status(404).send({
                success: false,
                message: 'Wallet not found'
            });
        }
        
        res.status(200).send({
            success: true,
            wallet
        });
    } catch (error) {
        next(error);
    }
};

// Create wallet
export const createWallet = async (req, res, next) => {
    const userId = req.userId;
    const { currency } = req.body;
    
    try {
        const existingWallet = await prisma.wallets.findFirst({
            where: {
                userId,
                currency
            }
        });
        
        if (existingWallet) {
            return res.status(400).send({
                success: false,
                message: 'Wallet already exists for this currency'
            });
        }
        
        const wallet = await prisma.wallets.create({
            data: {
                userId,
                currency,
                balance: 0
            }
        });
        
        res.status(201).send({
            success: true,
            message: 'Wallet created successfully',
            wallet
        });
    } catch (error) {
        next(error);
    }
};

// Update wallet balance (deposit or withdraw)
export const updateWalletBalance = async (req, res, next) => {
    const userId = req.userId;
    const { currency, amount, operation } = req.body;
    
    try {
        const wallet = await prisma.wallets.findFirst({
            where: {
                userId,
                currency
            }
        });
        
        if (!wallet) {
            return res.status(404).send({
                success: false,
                message: 'Wallet not found'
            });
        }
        
        let newBalance;
        
        if (operation === 'deposit') {
            newBalance = wallet.balance + parseFloat(amount);
        } else if (operation === 'withdraw') {
            if (wallet.balance < parseFloat(amount)) {
                return res.status(400).send({
                    success: false,
                    message: 'Insufficient balance'
                });
            }
            newBalance = wallet.balance - parseFloat(amount);
        } else {
            return res.status(400).send({
                success: false,
                message: 'Invalid operation'
            });
        }
        
        const updatedWallet = await prisma.wallets.update({
            where: {
                id: wallet.id
            },
            data: {
                balance: newBalance
            }
        });
        
        res.status(200).send({
            success: true,
            message: `${operation} successful`,
            wallet: updatedWallet
        });
    } catch (error) {
        next(error);
    }
};

// Transfer funds between wallets
export const transferFunds = async (req, res, next) => {
    const senderId = req.userId;
    const { receiverEmail, currency, amount } = req.body;
    
    try {
        const receiver = await prisma.users.findUnique({
            where: {
                email: receiverEmail
            }
        });
        
        if (!receiver) {
            return res.status(404).send({
                success: false,
                message: 'Receiver not found'
            });
        }
        
        const hasSufficientBalance = await WalletRepository.hasSufficientBalance(
            senderId, 
            currency, 
            parseFloat(amount)
        );
        
        if (!hasSufficientBalance) {
            return res.status(400).send({
                success: false,
                message: 'Insufficient balance'
            });
        }
        
        const transaction = await WalletRepository.processInternalTransaction(
            senderId,
            receiver.id,
            currency,
            parseFloat(amount)
        );
        
        res.status(200).send({
            success: true,
            message: 'Transfer successful',
            transaction
        });
    } catch (error) {
        next(error);
    }
};

export const getWalletStats = async (req, res, next) => {
    try {
        const stats = {
            totalBTC: await WalletRepository.getTotalBalance('BTC'),
            totalETH: await WalletRepository.getTotalBalance('ETH'),
            totalXRP: await WalletRepository.getTotalBalance('XRP'),
            totalDOGE: await WalletRepository.getTotalBalance('DOGE')
        };
        
        res.status(200).send({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
};