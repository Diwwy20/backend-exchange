import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Split ---> Bearer <token>
    const token = authHeader && authHeader.split(' ')[1];

    if(!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - no token provided"
        });
    }
    try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //    console.log("Decoded Token => ", decoded);

       if(!decoded) return res.status(401).json({
        success: false,
        message: "Unauthorized - invalid token"
       });

       req.userId = decoded.userId;
       
       next();

    } catch (error) {
        let err;
        if (error.name === 'TokenExpiredError') {
            err = new Error("Unauthorized - token expired");
            err.statusCode = 401;
        }
        else{
            err = new Error("Unauthorized - invalid token");
            err.statusCode = 401;
        }
        next(err);
    }
}