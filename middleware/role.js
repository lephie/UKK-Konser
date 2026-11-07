import {error} from '../utils/response.js';


export const roleMiddleware = (...allowedRoles) => {
    return (req, res, next ) =>{
        if(!allowedRoles.includes(req, user.role)){
            return error(res, "Unauthorized", 403)
        }
        next()
    }
}

export default (roleMiddleware)