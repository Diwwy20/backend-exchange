import prisma from "../config/prisma.config.js";
import { WalletRepository } from "../repositories/walletRepository.js";

export const createTransaction = async (req, res, next) => {
    const { receiverId, amount, currency } = req.body;
    const senderId = req.userId;
  
    try {
      const transaction = await WalletRepository.processInternalTransaction(
        senderId,
        receiverId,
        currency,
        parseFloat(amount)
      );
  
      res.status(201).send({
        success: true,
        message: 'Transaction created successfully',
        transaction
      });
    } catch (error) {
      next(error);
    }
  };

// Get user's transactions
export const getUserTransactions = async (req, res, next) => {
    const userId = req.userId;
    
    try {
        const sentTransactions = await prisma.transactions.findMany({
            where: {
                senderId: userId
            },
            include: {
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        const receivedTransactions = await prisma.transactions.findMany({
            where: {
                receiverId: userId
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        res.status(200).send({
            success: true,
            sentTransactions,
            receivedTransactions
        });
    } catch (error) {
        next(error);
    }
};

// Get transaction by ID
export const getTransactionById = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.userId;
    
    try {
        const transaction = await prisma.transactions.findUnique({
            where: { id: Number(id) },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        
        if (!transaction) {
            return res.status(404).send({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        // Check if user has access to this transaction
        if (transaction.senderId !== userId && transaction.receiverId !== userId) {
            return res.status(403).send({
                success: false,
                message: 'Unauthorized to view this transaction'
            });
        }
        
        res.status(200).send({
            success: true,
            transaction
        });
    } catch (error) {
        next(error);
    }
};

export const tradeCrypto = async (req, res, next) => {
    const { orderId, amount } = req.body;
    const buyerId = req.userId;
    console.log("Order Id: ", orderId);
    console.log("Amount: ", amount);
    console.log("Buy Id: ", buyerId);
    
    try {
        const order = await prisma.orders.findUnique({
            where: { id: Number(orderId) }
        });
        
        if (!order) {
            return res.status(404).send({
                success: false,
                message: 'Order not found'
            });
        }
        
        if (order.status !== 'ACTIVE') {
            return res.status(400).send({
                success: false,
                message: 'Order is not active'
            });
        }
        
        const sellerId = order.userId;
        
        if (sellerId === buyerId) {
            return res.status(400).send({
                success: false,
                message: 'Cannot trade with yourself'
            });
        }
        
        const fiatAmount = amount * order.pricePerCoin;
        
        if (order.type === 'SELL') {
            const sellerHasCrypto = await WalletRepository.hasSufficientBalance(
                sellerId, order.currency, amount
            );
            
            if (!sellerHasCrypto) {
                return res.status(400).send({
                    success: false,
                    message: `Seller has insufficient ${order.currency} balance`
                });
            }
        
            await WalletRepository.updateBalance(sellerId, order.currency, -amount);
            await WalletRepository.updateBalance(buyerId, order.currency, amount);
            
            const transaction = await prisma.transactions.create({
                data: {
                    senderId: sellerId,  
                    receiverId: buyerId, 
                    amount,
                    currency: order.currency,
                    fiatAmount,
                    fiat: order.fiat,
                    isExternal: false
                }
            });
            
            const remainingAmount = order.amount - amount;
            let updatedOrder;
            
            if (remainingAmount <= 0) {
                updatedOrder = await prisma.orders.update({
                    where: { id: Number(orderId) },
                    data: { 
                        status: 'COMPLETED',
                        amount: 0
                    }
                });
            } else {
                updatedOrder = await prisma.orders.update({
                    where: { id: Number(orderId) },
                    data: { amount: remainingAmount }
                });
            }
            
            return res.status(200).send({
                success: true,
                message: 'Trade completed successfully',
                transaction,
                order: updatedOrder
            });
            
        } else if (order.type === 'BUY') {
            const buyerHasCrypto = await WalletRepository.hasSufficientBalance(
                buyerId, order.currency, amount
            );
            
            if (!buyerHasCrypto) {
                return res.status(400).send({
                    success: false,
                    message: `Insufficient ${order.currency} balance`
                });
            }

            await WalletRepository.updateBalance(buyerId, order.currency, -amount);
            await WalletRepository.updateBalance(sellerId, order.currency, amount);
            
            const transaction = await prisma.transactions.create({
                data: {
                    senderId: buyerId,   
                    receiverId: sellerId, 
                    amount,
                    currency: order.currency,
                    fiatAmount,
                    fiat: order.fiat,
                    isExternal: false
                }
            });
            
            const remainingAmount = order.amount - amount;
            let updatedOrder;
            
            if (remainingAmount <= 0) {
                updatedOrder = await prisma.orders.update({
                    where: { id: Number(orderId) },
                    data: { 
                        status: 'COMPLETED',
                        amount: 0
                    }
                });
            } else {
                updatedOrder = await prisma.orders.update({
                    where: { id: Number(orderId) },
                    data: { amount: remainingAmount }
                });
            }
            
            res.status(200).send({
                success: true,
                message: 'Trade completed successfully',
                transaction,
                order: updatedOrder
            });
        } else {
            return res.status(400).send({
                success: false,
                message: 'Invalid order type'
            });
        }
    } catch (error) {
        next(error);
    }
};