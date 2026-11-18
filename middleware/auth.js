import jwt from 'jsonwebtoken';
    import { error } from '../utils/response.js';
    import dotenv from 'dotenv';
    import User from '../models/users.models.js';

    dotenv.config();

    export const authMiddleware = async (req, res, next) => {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return error(res, 'Access denied, no token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            console.log('JWT error:', err.name, err.message);
            return error(res, 'Invalid or expired token.', 401);
        }

        try {
            const user = await User.findByPk(decoded.id, {
                attributes: {exclude: ['password']}
            }); 

            if (!user) return error(res, 'User no longer exists', 401);
            if (!user.is_active) return error(res, 'Account deactivated', 403);

            req.user = user;
            next();
        } catch (err) {
            console.log('Auth middleware error:', err);
            return error(res, 'Internal server error', 500);
        }
    };

    export default authMiddleware; 