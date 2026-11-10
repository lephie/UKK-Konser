import { Concert, OrderTicket } from "../models/index.js";
import User from "../models/users.models.js";
import {success, error} from '../utils/response.js';
import { isEmail } from "../utils/validate.js";


export const getAllUser = async (req, res) => {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const where = { role: 'user' };
        if (req.query.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${req.query.search}%` } },
                { email: { [Op.like]: `%${req.query.search}%` } }
            ];
        }

        const { rows, count } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
        return success(res, paginated(rows, count, page, limit), 'Users fetched');
    } catch (err) {
        return error(res, err.message, 500);
    }
};


// activate/deactive
export const statusUser = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {id: req.params.id, role: 'user'}
        });

        if (!user) return error(res, 'User not found', 404);

        user.is_active = !user.is_active
        await user.save();

        const status = user.is_active ? 'activated' : 'deactivated' ;
        return success(res, {id: user.id, is_active: user.is_active}, `User ${status} Succesfully`)

    } catch (error) {
        return error(res, error.message, 500)
    }
}

export const getAllEO = async (req, res) => {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { rows, count } = await User.findAndCountAll({
            where: { role: 'event_organizer' },
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
        return success(res, paginated(rows, count, page, limit), 'Event Organizers fetched');
    } catch (err) {
        return error(res, err.message, 500);
    }
};

export const createEO = async (req, res) => {
    try {
        const body = req.body ?? {};
        const missing = missingFields(body, ['name', 'email', 'password']);
        if (missing.length) return error(res, `Missing fields: ${missing.join(', ')}`, 400);

        const email = String(body.email).trim().toLowerCase();
        if (!isEmail(email)) return error(res, 'Invalid email format', 400);
        if (String(body.password).length < 6) return error(res, 'Password must be at least 6 characters', 400);

        const exist = await User.findOne({ where: { email } });
        if (exist) return error(res, 'Email already registered', 400);

        const eo = await User.create({
            name: String(body.name).trim(),
            email,
            phone: body.phone ? String(body.phone).trim() : null,
            password: await authService.hashPassword(String(body.password)),
            role: 'event_organizer',
            is_active: true
        });

        return success(res, eo.toSafeJSON(), 'Event Organizer created', 201);
    } catch (err) {
        return error(res, err.message, 500);
    }
};


export const approveEO = async (req, res) => {
    try {
        const eo = await User.findOne({
            where : {id: req.params.id, role: 'event_organizer'}
        });

        if(!eo) return error(res, 'Event Organizer not found', 404)
        if(eo.is_active) return error(res, 'Event Organizer already approved', 400)
        
        eo.is_active = true;
        await eo.save();

        return success(res, {id: eo.id, is_active: eo.is_active}, 'Event Organizer Approved')

    } catch (error) {
        return error(res, error.message, 500)
    }
}

export const rejectEO = async (req, res) => {
    try {
        const eo = await User.findOne({
            where : {id: req.params.id, role: 'event_organizer'}
        });

        if(!eo) return error(res, 'Event Organizer not found', 404)
        if(!eo.is_active) return error(res, 'Event Organizer already inactive', 400)
        
        eo.is_active = false;
        await eo.save();

        return success(res, {id: eo.id, is_active: eo.is_active}, 'Event Organizer Rejected')
    } catch (error) {
        return error(res, error.message, 500)
    }
}

export const getAllConcert = async (req, res) => {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const where = {};
        if (req.query.status) where.status = req.query.status;

        const { rows, count } = await Concert.findAndCountAll({
            where,
            include: [
                { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] },
                { model: TicketTier, as: 'tiers', attributes: ['id', 'name', 'price', 'quota', 'sold'] }
            ],
            order: [['created_at', 'DESC']],
            distinct: true,
            limit,
            offset
        });
        return success(res, paginated(rows.map(presentConcert), count, page, limit), 'Concerts fetched successfully');
    } catch (err) {
        return error(res, err.message, 500);
    }
}

export const removeConcert = async (req, res) => {
    try {
        const concert = await Concert.findByPk(req.params.id);
        if (!concert) return error(res, 'Concert not found', 404);

        const paidOrder = await OrderTicket.findOne({
            where: { concert_id: concert.id, status: 'paid' }
        });
        if (paidOrder) return error(res, 'Cannot delete a concert that has paid orders', 409);

        await concert.destroy();
        return success(res, null, 'Concert removed successfully');
    } catch (err) {
        return error(res, err.message, 500);
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const where = {};
        if (req.query.status) where.status = req.query.status;

        const { rows, count } = await OrderTicket.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                { model: Concert, as: 'concert', attributes: ['id', 'title'] }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
        return success(res, paginated(rows, count, page, limit), 'Orders fetched');
    } catch (err) {
        return error(res, err.message, 500);
    }
};

export const getDashboard = async (req, res) => {
    try {
        const [users, organizers, concertsByStatus, paid, ticketsIssued, ticketsUsed] = await Promise.all([
            User.count({ where: { role: 'user' } }),
            User.count({ where: { role: 'event_organizer' } }),
            Concert.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'total']], group: ['status'], raw: true }),
            OrderTicket.findOne({
                attributes: [
                    [fn('COUNT', col('id')), 'paid_orders'],
                    [fn('COALESCE', fn('SUM', col('total_price')), 0), 'revenue']
                ],
                where: { status: 'paid' },
                raw: true
            }),
            Ticket.count({ where: { status: { [Op.ne]: 'cancelled' } } }),
            Ticket.count({ where: { status: 'used' } })
        ]);

        const concerts = { draft: 0, published: 0, cancelled: 0 };
        concertsByStatus.forEach((c) => { concerts[c.status] = Number(c.total); });

        return success(res, {
            users,
            event_organizers: organizers,
            concerts,
            paid_orders: Number(paid.paid_orders),
            revenue: Number(paid.revenue),
            tickets_issued: ticketsIssued,
            tickets_checked_in: ticketsUsed
        }, 'Dashboard fetched');
    } catch (err) {
        return error(res, err.message, 500);
    }
};
