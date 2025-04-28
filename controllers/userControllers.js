import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import prisma from "../config/prisma.config.js";
import { generateTokens } from "../utils/generateToken.js";

// Register Controller
export const register = async (req, res, next) => {
    const { email, password } = req.body;
  
    try {
        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).send({ success: false, message: 'Email already registered' });
        }
  
        const hashedPassword = await bcrypt.hash(password, 10);
  
        const user = await prisma.users.create({
            data: {
                email,
                password: hashedPassword,
                emailVerified: true,
            },
        });
  
        await prisma.wallets.createMany({
            data: [
                { userId: user.id, currency: 'BTC', balance: 10 },
                { userId: user.id, currency: 'ETH', balance: 40 },
                { userId: user.id, currency: 'XRP', balance: 200000 },
                { userId: user.id, currency: 'DOGE', balance: 1000000 },
            ]
        });
  

        res.status(201).send({
            success: true,
            message: 'User registered successfully with starter wallets!',
            user,
        });
    } catch (error) {
        next(error);
    }
};

// Login Controller
export const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.users.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'User not found'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).send({
                success: false,
                message: 'Invalid password'
            });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        await prisma.refresh_tokens.create({
            data: {
                token: refreshToken,
                userId: user.id
            }
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).send({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
            },
            accessToken
        });
    } catch (error) {
        next(error);
    }
};

// Get Profile Controller
export const profile = async (req, res, next) => {
    try {
        const user = await prisma.users.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            }
        });
       
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).send({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};


// RefreshToken Controller
export const refreshToken = async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if(!refreshToken){
        return res.status(401).send({
            success: false,
            message: "No refresh token provided"
        });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        const storedToken = await prisma.refresh_tokens.findUnique({
            where: {
                token: refreshToken
            }
        });

        if(!storedToken){
            return res.status(401).send({
                success: false,
                message: "Invalid refresh token"
            });
        }

        const { accessToken } = generateTokens(decoded.userId);

        res.status(200).send({
            success: true,
            message: "Token refreshed successfully",
            accessToken
        });

    } catch (error) {
        next(error);
    }
};

// Logout Controller
export const logout = async (req, res, next) => {
    const { refreshToken } = req.cookies;

    if(!refreshToken){
        return res.status(400).send({
            success: false,
            message: "No refresh token provided"
        });
    }

    try {
        const storedToken = await prisma.refresh_tokens.findUnique({
            where: {
                token: refreshToken
            } 
        });

        if(!storedToken){
            return res.status(400).send({
                success: false,
                message: "Refresh token not found"
            });
        }

        await prisma.refresh_tokens.delete({
            where: {
                token: refreshToken
            }
        })

        res.clearCookie('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            maxAge: 0
        });

        res.status(200).send({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        next(error);
    }
};

export const findUserByEmail = async (req, res, next) => {
    const { email } = req.query;
  
    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email is required",
      });
    }
  
    try {
      const user = await prisma.users.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });
  
      if (!user) {
        return res.status(404).send({
          success: false,
          message: "User not found",
        });
      }
  
      res.status(200).send({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  };