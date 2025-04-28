import prisma from '../config/prisma.config.js';

export const WalletRepository = {
  // Find wallet with user details
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

  // Find user's wallet by currency
  async findByCurrencyAndUser(currency, userId) {
    return prisma.wallets.findFirst({
      where: {
        currency,
        userId
      }
    });
  },

  // Get total balances for a specific currency across all users
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

  // Check if user has sufficient balance
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

  // New function to update a wallet balance
  async updateBalance(userId, currency, amount) {
    // Find the wallet
    let wallet = await prisma.wallets.findFirst({
      where: {
        userId,
        currency
      }
    });
    
    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallets.create({
        data: {
          userId,
          currency,
          balance: 0
        }
      });
    }
    
    // Update the balance
    const newBalance = wallet.balance + amount;
    if (newBalance < 0) {
      throw new Error(`Insufficient ${currency} balance`);
    }
    
    return prisma.wallets.update({
      where: { id: wallet.id },
      data: { balance: newBalance }
    });
  },

  // Process transaction between users
  async processInternalTransaction(senderId, receiverId, currency, amount) {
    // Start a transaction
    return prisma.$transaction(async (tx) => {
      // 1. Find sender's wallet
      const senderWallet = await tx.wallets.findFirst({
        where: {
          userId: senderId,
          currency
        }
      });

      if (!senderWallet || senderWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // 2. Find or create receiver's wallet
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

      // 3. Update sender's wallet
      await tx.wallets.update({
        where: { id: senderWallet.id },
        data: { balance: senderWallet.balance - amount }
      });

      // 4. Update receiver's wallet
      await tx.wallets.update({
        where: { id: receiverWallet.id },
        data: { balance: receiverWallet.balance + amount }
      });

      // 5. Create transaction record
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