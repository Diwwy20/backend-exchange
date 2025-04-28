import prisma from '../config/prisma.config.js';

export const UserRepository = {
  // Get user with wallets
  async findWithWallets(userId) {
    return prisma.users.findUnique({
      where: { id: userId },
      include: {
        wallets: true
      }
    });
  },

  // Get user with orders
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

  // Get user with transactions (both sent and received)
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

  // Get user's complete profile with all relations
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