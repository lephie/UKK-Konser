import { Concert, TicketTier, Ticket, OrderDetail } from '../models/index.js';
import { qrToDataURL } from '../services/qr.service.js';
import { success, error } from '../utils/response.js';
import { getPagination, paginated } from '../utils/pagination.js';

const ticketInclude = [
    { model: Concert, as: 'concert', attributes: ['id', 'title', 'date', 'venue', 'location', 'banner_url', 'status'] },
    { model: TicketTier, as: 'tier', attributes: ['id', 'name'] },
    { model: OrderDetail, as: 'detail', attributes: ['id', 'order_id'] }
];

// GET /tickets?status=unused|used|cancelled &concert_id=   ("My Tickets")
export const getMyTickets = async (req, res) => {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const where = { user_id: req.user.id };
        if (req.query.status) where.status = req.query.status;
        if (req.query.concert_id) where.concert_id = req.query.concert_id;

        const { rows, count } = await Ticket.findAndCountAll({
            where,
            include: ticketInclude,
            order: [['id', 'DESC']],
            distinct: true,
            limit,
            offset
        });
        return success(res, paginated(rows, count, page, limit), 'Tickets fetched');
    } catch (err) {
        return error(res, err.message, 500);
    }
};

// GET /tickets/:id  -> includes qr_image (PNG data URL) to show at the gate
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: ticketInclude
        });
        if (!ticket) return error(res, 'Ticket not found', 404);

        const qr_image = await qrToDataURL(ticket.qr_code);
        return success(res, { ...ticket.toJSON(), qr_image }, 'Ticket fetched');
    } catch (err) {
        return error(res, err.message, 500);
    }
};
