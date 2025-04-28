import prisma from '../config/prisma.config.js';

export const TransactionRepository = {
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