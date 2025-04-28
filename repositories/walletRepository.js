import prisma from '../config/prisma.config.js';

export const WalletRepository = {
  async findWithUser(walletId) {
    return prisma.wallets.findUnique({
      where: { id: Number(walletId) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  },

  async findByCurrencyAndUser(currency, userId) {
    return prisma.wallets.findFirst({
      where: {
        currency,
        userId
      }
    });
  },

  async getTotalBalance(currency) {
    const result = await prisma.wallets.aggregate({
      where: {
        currency
      },
      _sum: {
        balance: true
      }
    });

    return result._sum.balance || 0;
  },

  async hasSufficientBalance(userId, currency, amount) {
    const wallet = await prisma.wallets.findFirst({
      where: {
        userId,
        currency
      }
    });

    if (!wallet) return false;
    return wallet.balance >= amount;
  },

  async updateBalance(userId, currency, amount) {
    let wallet = await prisma.wallets.findFirst({
      where: {
        userId,
        currency
      }
    });
    
    if (!wallet) {
      wallet = await prisma.wallets.create({
        data: {
          userId,
          currency,
          balance: 0
        }
      });
    }
    
    const newBalance = wallet.balance + amount;
    if (newBalance < 0) {
      throw new Error(`Insufficient ${currency} balance`);
    }
    
    return prisma.wallets.update({
      where: { id: wallet.id },
      data: { balance: newBalance }
    });
  },

  async processInternalTransaction(senderId, receiverId, currency, amount) {
  
    return prisma.$transaction(async (tx) => {
   
      const senderWallet = await tx.wallets.findFirst({
        where: {
          userId: senderId,
          currency
        }
      });

      if (!senderWallet || senderWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }


      let receiverWallet = await tx.wallets.findFirst({
        where: {
          userId: receiverId,
          currency
        }
      });

      if (!receiverWallet) {
        receiverWallet = await tx.wallets.create({
          data: {
            userId: receiverId,
            currency,
            balance: 0
          }
        });
      }


      await tx.wallets.update({
        where: { id: senderWallet.id },
        data: { balance: senderWallet.balance - amount }
      });

  
      await tx.wallets.update({
        where: { id: receiverWallet.id },
        data: { balance: receiverWallet.balance + amount }
      });

   
      const transaction = await tx.transactions.create({
        data: {
          senderId,
          receiverId,
          amount,
          currency,
          isExternal: false
        }
      });

      return transaction;
    });
  }
};