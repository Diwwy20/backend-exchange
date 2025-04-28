import { OrderRepository } from "../repositories/orderRepository.js";
import { TransactionRepository } from "../repositories/transactionRepository.js";

export const getMarketData = async (req, res, next) => {
    const { currency } = req.params;
    
    try {
        const marketData = await OrderRepository.getMarketData(currency);
        const transactionStats = await TransactionRepository.getStatsByCurrency(currency);
        
        res.status(200).send({
            success: true,
            currency,
            marketData,
            transactionStats
        });
    } catch (error) {
        next(error);
    }
};

export const getBuyOrders = async (req, res, next) => {
    const { currency } = req.params;
    
    try {
        const orders = await OrderRepository.findActiveByCurrency(currency, 'BUY');
        
        res.status(200).send({
            success: true,
            orders
        });
    } catch (error) {
        next(error);
    }
};

export const getSellOrders = async (req, res, next) => {
    const { currency } = req.params;
    
    try {
        const orders = await OrderRepository.findActiveByCurrency(currency, 'SELL');
        
        res.status(200).send({
            success: true,
            orders
        });
    } catch (error) {
        next(error);
    }
};