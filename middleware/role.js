import {error} from '../utils/response.js';


export const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return error(res, 'Forbidden: you do not have access to this resource', 403);
        }
        next();
    };
};
export default (roleMiddleware)