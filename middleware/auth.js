import jwt from 'jsonwebtoken';
import {error} from '../utils/response.js';
import dotenv  from 'dotenv';

dotenv.config();

export const authMiddleware = (req, res, next ) => {
    const authHeader = req.headers['authorization'];  

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return error(res, "Access denied, no token provided", 401);
    }

    const token = authHeader.split("")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded

        if (!user) return error(res, 'User no longer exists', 401);
        if (!user.is_active) return error(res, 'Account deactivated', 403);

        next();
    } catch (error) {
        return error(res, 'Invalid or expired token.', 401)
    }
}



export default authMiddleware;