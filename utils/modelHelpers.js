import prisma from "../config/prisma.config.js";

// User related helpers
export const getUserWithWallets = async (userId) => {
  return await prisma.users.findUnique({
    where: { id: userId },
    include: {
      wallets: true
    }
  });
};

export const getUserWithOrders = async (userId) => {
  return await prisma.users.findUnique({
    where: { id: userId },
    include: {
      orders: true
    }
  });
};

export const getUserWithTransactions = async (userId) => {
  return await prisma.users.findUnique({
    where: { id: userId },
    include: {
      sentTransactions: true,
      receivedTransactions: true
    }
  });
};

export const getUserWithAll = async (userId) => {
  return await prisma.users.findUnique({
    where: { id: userId },
    include: {
      wallets: true,
      orders: true,
      sentTransactions: true,
      receivedTransactions: true
    }
  });
};

// Wallet related helpers
export const getWalletWithUser = async (walletId) => {
  return await prisma.wallets.findUnique({
    where: { id: walletId },
    include: {
      user: true
    }
  });
};

// Order related helpers
export const getOrderWithUser = async (orderId) => {
  return await prisma.orders.findUnique({
    where: { id: orderId },
    include: {
      user: true
    }
  });
};

// Transaction related helpers
export const getTransactionWithUsers = async (transactionId) => {
  return await prisma.transactions.findUnique({
    where: { id: transactionId },
    include: {
      sender: true,
      receiver: true
    }
  });
};

// Get active buy orders for a specific currency
export const getActiveBuyOrders = async (currency) => {
  return await prisma.orders.findMany({
    where: {
      currency,
      type: 'BUY',
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      pricePerCoin: 'desc' // Highest buy price first
    }
  });
};

// Get active sell orders for a specific currency
export const getActiveSellOrders = async (currency) => {
  return await prisma.orders.findMany({
    where: {
      currency,
      type: 'SELL',
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      pricePerCoin: 'asc' // Lowest sell price first
    }
  });
};

// Get user's wallet balance for a specific currency
export const getUserWalletBalance = async (userId, currency) => {
  const wallet = await prisma.wallets.findFirst({
    where: {
      userId,
      currency
    }
  });
  
  return wallet ? wallet.balance : 0;
};

// Execute a trade between a buyer and a seller
export const executeTrade = async (buyerId, sellerId, orderId, amount, currency) => {
  // Start a transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Get the order
    const order = await tx.orders.findUnique({
      where: { id: orderId }
    });
    
    if (!order || order.status !== 'ACTIVE') {
      throw new Error('Order is not available');
    }
    
    // Calculate fiat amount
    const fiatAmount = amount * order.pricePerCoin;
    
    // Update buyer's wallet
    const buyerWallet = await tx.wallets.findFirst({
      where: { userId: buyerId, currency }
    });
    
    if (!buyerWallet) {
      await tx.wallets.create({
        data: {
          userId: buyerId,
          currency,
          balance: amount
        }
      });
    } else {
      await tx.wallets.update({
        where: { id: buyerWallet.id },
        data: { balance: buyerWallet.balance + amount }
      });
    }
    
    // Update seller's wallet
    const sellerWallet = await tx.wallets.findFirst({
      where: { userId: sellerId, currency }
    });
    
    if (!sellerWallet || sellerWallet.balance < amount) {
      throw new Error('Seller has insufficient balance');
    }
    
    await tx.wallets.update({
      where: { id: sellerWallet.id },
      data: { balance: sellerWallet.balance - amount }
    });
    
    // Create transaction record
    const transaction = await tx.transactions.create({
      data: {
        senderId: sellerId,
        receiverId: buyerId,
        amount,
        currency,
        fiatAmount,
        fiat: order.fiat,
        isExternal: false
      }
    });
    
    // Update order
    const remainingAmount = order.amount - amount;
    if (remainingAmount <= 0) {
      await tx.orders.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', amount: 0 }
      });
    } else {
      await tx.orders.update({
        where: { id: orderId },
        data: { amount: remainingAmount }
      });
    }
    
    return { transaction };
  });
};