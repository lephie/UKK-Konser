import { OrderTicket, OrderDetail, TicketTier, Concert } from '../models/index.js';
import { expireOrder } from '../services/order.service.js';
import { error } from '../utils/response.js';

// For routes with /:id that point to the logged-in user's order.
// - loads the order (only if it belongs to the user)
// - if it is pending but already past expires_at, expires it right now and releases the held quota
//   (the background job does the same every minute, this just makes it instant for the user)
// - exposes it as req.order
export const orderExpiry = async (req, res, next) => {
    try {
        const include = [
            {
                model: OrderDetail,
                as: 'details',
                include: [{ model: TicketTier, as: 'tier', attributes: ['id', 'name'] }]
            },
            { model: Concert, as: 'concert', attributes: ['id', 'title', 'date', 'venue', 'location', 'status'] }
        ];

        let order = await OrderTicket.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include
        });
        if (!order) return error(res, 'Order not found', 404);

        if (order.status === 'pending' && new Date(order.expires_at) <= new Date()) {
            await expireOrder(order.id);
            order = await OrderTicket.findByPk(order.id, { include });
        }

        req.order = order;
        next();
    } catch (err) {
        return error(res, err.message, 500);
    }
};

export default orderExpiry;
