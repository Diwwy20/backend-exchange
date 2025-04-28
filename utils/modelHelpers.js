import prisma from "../config/prisma.config.js";

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

export const getWalletWithUser = async (walletId) => {
  return await prisma.wallets.findUnique({
    where: { id: walletId },
    include: {
      user: true
    }
  });
};

export const getOrderWithUser = async (orderId) => {
  return await prisma.orders.findUnique({
    where: { id: orderId },
    include: {
      user: true
    }
  });
};

export const getTransactionWithUsers = async (transactionId) => {
  return await prisma.transactions.findUnique({
    where: { id: transactionId },
    include: {
      sender: true,
      receiver: true
    }
  });
};

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
      pricePerCoin: 'desc' 
    }
  });
};

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
      pricePerCoin: 'asc' 
    }
  });
};

export const getUserWalletBalance = async (userId, currency) => {
  const wallet = await prisma.wallets.findFirst({
    where: {
      userId,
      currency
    }
  });
  
  return wallet ? wallet.balance : 0;
};

export const executeTrade = async (buyerId, sellerId, orderId, amount, currency) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({
      where: { id: orderId }
    });
    
    if (!order || order.status !== 'ACTIVE') {
      throw new Error('Order is not available');
    }
    
    
    const fiatAmount = amount * order.pricePerCoin;
    
    
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