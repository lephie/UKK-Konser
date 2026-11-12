import { Concert, OrderDetail, OrderTicket, Ticket, TicketTier, User } from "../models/index.js";
import { findOwnedConcert } from "../services/concert.service";
import { getPagination, paginated } from "../utils/pagination.js";
import { success } from "../utils/response.js"

export const getProfile = async (req, res) => {
    return success(res, req.user, 'Profile fetched')
}

export const updateProfile = async (req, res) => {
    try {
        const body = req.body ?? {};
        const updated = {};

        if(body.name === undefined){
            if(!String(body.name).trim()) return error(res, 'name cannot be emptu', 400)
                updated.name = String(body.name).trim();
        }
        if(body.phone === undefined) updated.phone = body.phone ? String(body.phone).trim() : null;
        if(Object.keys(updated).length === 0) return error(res, 'Nothing to update', 400);

        const user = await User.findByPk(req.user.id);
        await user.update(updated)
        return success(res, user.toSafeJSON(), 'Profile updated');
    } catch (err) {
        console.error(res, err.message, 500)
    }
}

export const getDashboard = async (req, res) => {
    try {
        const concert = Concert.findAll({where: {created_by: req.user.id}, attributes: ['id', 'status']});
        const ids = concert.map((c) => c.id);

        const byStatus = {draft: 0, published: 0, cancelled: 0};
        concert.forEach((c) => {byStatus[c.status]++; });

        if(ids.length === 0){
            return success(res, {concert: byStatus, paid_order: 0, revenue: 0, ticket_issues: 0, ticket_check_in: 0}, 'Dashboard fetched');
        }

        const [paid, issues, checkIn] = await Promise.all([
            OrderTicket.findOne({
                attributes:[
                    [fn('COUNT', col('id')), 'paid_order'],
                    [fn('COALESCE', fn('SUM', col('total_price')), 0), 'revenue']
                ],
                where: {status: 'paid', concert_id: ids},
                raw: true
            }),
            Ticket.count({ where: {concert_id: ids, status: {[Op.ne]: 'cancelled'}}}), // ne: != not equal
            Ticket.count({where: {concert_id: ids, status: 'used'}})
            
        ]);

        return success(res, {
            concert: byStatus,
            paid_order: Number(paid.paid_order),
            revenue: Number(paid.revenue),
            ticket_issues: issues,
            ticket_check_in: checkIn,
        }, 'Dashboard fetched');

    } catch (err) {
        return error(res, err.message, 500)
    }
}

export const getConcertOrder = async (req,res) => {
    try {
        const concert = await findOwnedConcert(req.params.id, req.user.id )
        if(!concert) return error(res, 'concert not found', 404)
        
        const {page, limit, offset } = getPagination(req.query);
        const where = {concert_id: concert.id}
        if(req.query.status) where.status = req.query.status

        const {rows, count } = await OrderTicket.findAndCountAll({
            where,
            include: [
                {model: User, as: 'user', attributes: ['id','names','phone','email']},
                {
                    model: OrderDetail,
                    as: 'details',
                    include: [{models: TicketTier, as: 'tier', attributes: ['id', 'name']}]
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true,
            limit, 
            offset
        })

        return success(res, paginated(rows, count, page, limit), 'Order fetched');
    } catch (err) {
        return error(res, err.message, 500)
    }
}

// atendees = yang punye tiket
export const getAttendees = async (req, res) => {
    try {
        const concert = await findOwnedConcert(req.params.id, req.user.id )
        if(!concert) return error(res, 'concert not found', 404)

        const { page, limit, offset } = getPagination(req.query, 20);
        const where = { concert_id: concert.id };
        if (req.query.status) where.status = req.query.status;
        if (req.query.tier_id) where.ticket_tier_id = req.query.tier_id;

        const {rows, count} = await Ticket.findAndCountAll({
            where,
            include: [
                { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: TicketTier, as: 'tier', attributes: ['id', 'name'] }
            ],
            order: [['id', 'ASC']],
            limit,
            offset
        });
        return success(res, paginated(rows, count, page, limit), 'Atendees fetched')
    } catch (err) {
        console.error(res, err.message, 500)   
    }
} 

export const getConcertReport = async (req, res) => {
    try {
        const concert = await findOwnedConcert(req.params.id, req.user.id )
        if(!concert) return error(res, 'concert not found', 404)
            
        const [tiers, ticketCounts, paid, tierRevenue] = await Promise.all([
            TicketTier.findAll({ where: { concert_id: concert.id }, order: [['id', 'ASC']] }),
            Ticket.findAll({
                attributes: ['ticket_tier_id', 'status', [fn('COUNT', col('id')), 'total']],
                where: { concert_id: concert.id },
                group: ['ticket_tier_id', 'status'],
                raw: true
            }),
            OrderTicket.findOne({
                attributes: [
                    [fn('COUNT', col('id')), 'paid_orders'],
                    [fn('COALESCE', fn('SUM', col('total_price')), 0), 'revenue']
                ],
                where: { concert_id: concert.id, status: 'paid' },
                raw: true
            }),
            // revenue per tier from what was really charged (unit_price at purchase time), not today's price
            OrderDetail.findAll({
                attributes: ['ticket_tier_id', [fn('SUM', col('OrderDetail.subtotal')), 'revenue']],
                include: [{
                    model: OrderTicket,
                    as: 'order',
                    attributes: [],
                    where: { concert_id: concert.id, status: 'paid' }
                }],
                group: ['OrderDetail.ticket_tier_id'],
                raw: true
            })
        ]);

        const perTier = tiers.map((tier) => {
            const counts = { unused: 0, used: 0, cancelled: 0 };
            ticketCounts
                .filter((c) => c.ticket_tier_id === tier.id)
                .forEach((c) => { counts[c.status] = Number(c.total); });

            const t = presentTier(tier);
            return {
                tier_id: tier.id,
                name: tier.name,
                price: tier.price,
                quota: tier.quota,
                held_or_sold: tier.sold, // paid + currently held by unpaid orders
                available: t.available,
                tickets_issued: counts.unused + counts.used,
                checked_in: counts.used,
                cancelled: counts.cancelled,
                revenue: Number(tierRevenue.find((r) => r.ticket_tier_id === tier.id)?.revenue ?? 0)
            };
        });

        return success(res, {
            concert: { id: concert.id, title: concert.title, date: concert.date, status: concert.status },
            paid_orders: Number(paid.paid_orders),
            revenue: Number(paid.revenue),
            tickets_issued: perTier.reduce((s, t) => s + t.tickets_issued, 0),
            checked_in: perTier.reduce((s, t) => s + t.checked_in, 0),
            tiers: perTier
        }, 'Report fetched');

    } catch (error) {
        console.error(res, err.message, 500)
    }
}