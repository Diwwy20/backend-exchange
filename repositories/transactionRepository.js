import prisma from '../config/prisma.config.js';

export const TransactionRepository = {
  // Find transaction with related users
  async findWithRelations(transactionId) {
    return prisma.transactions.findUnique({
      where: { id: Number(transactionId) },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        receiver: {
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

  // Get user's transactions (both sent and received)
  async findByUser(userId) {
    const sentTransactions = await prisma.transactions.findMany({
      where: {
        senderId: userId
      },
      include: {
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
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
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { sentTransactions, receivedTransactions };
  },

  // Get transaction statistics by currency
  async getStatsByCurrency(currency) {
    const totalVolume = await prisma.transactions.aggregate({
      where: {
        currency
      },
      _sum: {
        amount: true
      }
    });

    const count = await prisma.transactions.count({
      where: {
        currency
      }
    });

    const latestTransactions = await prisma.transactions.findMany({
      where: {
        currency
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return {
      totalVolume: totalVolume._sum.amount || 0,
      count,
      latestTransactions
    };
  }
};