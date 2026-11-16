import { error } from '../utils/response.js';

// Use after authMiddleware + roleMiddleware('event_organizer').
// An EO whose account was deactivated/rejected by the super admin can't manage concerts or scan tickets.
export const eoApproved = (req, res, next) => {
    if (req.user.role === 'event_organizer' && !req.user.is_active) {
        return error(res, 'Your Event Organizer account is not approved or has been deactivated', 403);
    }
    next();
};

export default eoApproved;
