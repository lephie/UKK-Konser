import { error } from '../utils/response.js';

export const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user || !allowedRoles.includes(user.role)) {
            return error(res, "Unauthorized", 403);
        }

        next();
    };
};

export default roleMiddleware;
