import prisma from "../config/prisma.config.js";

export const createOrder = async (req, res, next) => {
    const { type, currency, amount, pricePerCoin, fiat } = req.body;
    const userId = req.userId;

    try {
        const order = await prisma.orders.create({
            data: {
                userId,
                type,
                currency,
                amount,
                pricePerCoin,
                fiat,
                status: 'ACTIVE'
            }
        });

        res.status(201).send({
            success: true,
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        next(error);
    }
};

export const getOrders = async (req, res, next) => {
    const { type, currency, fiat, status } = req.query;
    
    try {
        const filters = {};
        
        if (type) filters.type = type;
        if (currency) filters.currency = currency;
        if (fiat) filters.fiat = fiat;
        if (status) filters.status = status;
        
        const orders = await prisma.orders.findMany({
            where: filters,
            include: {
                user: {
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
            orders
        });
    } catch (error) {
        next(error);
    }
};

// Get user's orders
export const getUserOrders = async (req, res, next) => {
    const userId = req.userId;
    
    try {
        const orders = await prisma.orders.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        res.status(200).send({
            success: true,
            orders
        });
    } catch (error) {
        next(error);
    }
};

// Update order status
export const updateOrderStatus = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    
    try {
        const order = await prisma.orders.findUnique({
            where: { id: Number(id) }
        });
        
        if (!order) {
            return res.status(404).send({
                success: false,
                message: 'Order not found'
            });
        }
        
        if (order.userId !== userId) {
            return res.status(403).send({
                success: false,
                message: 'Unauthorized to update this order'
            });
        }
        
        const updatedOrder = await prisma.orders.update({
            where: { id: Number(id) },
            data: { status }
        });
        
        res.status(200).send({
            success: true,
            message: 'Order updated successfully',
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};

// Cancel order
export const cancelOrder = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.userId;
    
    try {
        const order = await prisma.orders.findUnique({
            where: { id: Number(id) }
        });
        
        if (!order) {
            return res.status(404).send({
                success: false,
                message: 'Order not found'
            });
        }
        
        if (order.userId !== userId) {
            return res.status(403).send({
                success: false,
                message: 'Unauthorized to cancel this order'
            });
        }
        
        const updatedOrder = await prisma.orders.update({
            where: { id: Number(id) },
            data: { status: 'CANCELLED' }
        });
        
        res.status(200).send({
            success: true,
            message: 'Order cancelled successfully',
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};