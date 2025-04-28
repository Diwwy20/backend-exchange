import prisma from "../config/prisma.config.js";

export const OrderRepository = {
  async findWithUser(orderId) {
    return prisma.orders.findUnique({
      where: { id: Number(orderId) },
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

  async findActiveByCurrency(currency, type = null) {
    const filters = {
      currency,
      status: 'ACTIVE'
    };

    if (type) {
      filters.type = type;
    }

    return prisma.orders.findMany({
      where: filters,
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
        pricePerCoin: type === 'BUY' ? 'desc' : 'asc'
      }
    });
  },

  async findByTypeAndUser(type, userId) {
    return prisma.orders.findMany({
      where: {
        type,
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  async getMarketData(currency) {
    const buyOrders = await prisma.orders.findMany({
      where: {
        type: 'BUY',
        currency,
        status: 'ACTIVE'
      },
      orderBy: {
        pricePerCoin: 'desc'
      },
      take: 1
    });

    const sellOrders = await prisma.orders.findMany({
      where: {
        type: 'SELL',
        currency,
        status: 'ACTIVE'
      },
      orderBy: {
        pricePerCoin: 'asc'
      },
      take: 1
    });

    return {
      highestBuy: buyOrders.length > 0 ? buyOrders[0].pricePerCoin : null,
      lowestSell: sellOrders.length > 0 ? sellOrders[0].pricePerCoin : null,
      spread: buyOrders.length > 0 && sellOrders.length > 0 
        ? sellOrders[0].pricePerCoin - buyOrders[0].pricePerCoin
        : null
    };
  }
};