import prisma from '../config/prisma.config.js';

export const UserRepository = {
  async findWithWallets(userId) {
    return prisma.users.findUnique({
      where: { id: userId },
      include: {
        wallets: true
      }
    });
  },

  async findWithOrders(userId) {
    return prisma.users.findUnique({
      where: { id: userId },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
  },

  async findWithTransactions(userId) {
    return prisma.users.findUnique({
      where: { id: userId },
      include: {
        sentTransactions: {
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
        },
        receivedTransactions: {
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
        }
      }
    });
  },

  async findCompleteProfile(userId) {
    return prisma.users.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        orders: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        sentTransactions: {
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
        },
        receivedTransactions: {
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
        }
      }
    });
  }
};