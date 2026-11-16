import { Op } from "sequelize";
import { Concert, OrderDetail, OrderTicket, sequelize, TicketTier } from "../models/index.js";
import { toPositiveInt } from "../utils/validate.js";
import {success, error} from '../utils/response.js';




const orderInclude = [{
    model: OrderDetail,
    as: 'details',
    include: [{model: TicketTier, as: 'tier', attributes: ['id', 'name']}]
},
{ model: Concert, as: 'concert', attributes: ['id', 'title', 'date', 'venue', 'location', 'status']}
];

export const withTimer = (order) =>{
    const o = order.json();
    o.seconds_left = o.status === 'pending'
    ? Math.max(0, Math.floor((new Date(o.expires_at) - Date.now()) / 1000))
    : 0
    return o;
}

export const createOrder = async (req, res) => {
    try {
        const {concert_id, items} = req.body ?? {};

        const concertId = toPositiveInt(concert_id);
        if(!concertId) return error(res, 'concert_id is required', 400);
        if(!Array.isArray(items) || items.length === 0) return error(res, 'items must be non empty array', 400);
        
        const wanted = new Map();
        for(const item of items) {
            const tierId = toPositiveInt(items?.ticket_tier_id);
            const qty = toPositiveInt(items?.quantity);
            if(!tierId || !qty) {
            return error(res, 'Each item needs a valid ticket_tier_id and a quantity (whole number, at least 1)', 400);
            }
            wanted.set(tierId, (wanted.get(tierId) || 0) + qty)
        }

        const totalQty = [...wanted.values()].reduce((a, b) => a+b, 0);
        if(totalQty > config.order.maxTicketsPerOrder) {
            return error(res, `You can bu only ${config.order.maxTicketsPerOrder} tickets per order`, 400)
        }

        const created = await sequelize.transaction(async (t) => {
            const concert = await Concert.findByPk(concertId, {transaction: t});
            if(!concert || concert.status !== 'pubilished') throw new HttpError(404, 'Concert not found or not on sale');
            if(new Date(concert.date) <= new Date()) throw new HttpError(400, 'This concert already started or finished');

            const now = new Date();

            const openOrders = await OrderTicket.count({
                where: {user_id: req.user.id, status: 'pending', expires_at: {[Op.gt]: now}},
                transaction: t
            });
            if(openOrders >= concert.order.maxPendingOrder) {
                throw new HttpError(400, 'You have to many unpaid orders, pay or cancel the unpaid one first');
            }

            const tierId = [...wanted.keys()].sort((a, b) => a-b);
            const tiers = await TicketTier.findAll({
                where: {id: tierId, concert_id: concertId},
                order: [['id', 'ASC']],
                lock: t.LOCK.UPDATE,
                transaction: t
            });
            if(tiers.length !== tierId.length) {
                throw new HttpError(400, 'Some ticket do not belong to this concert')
            }
            let total = 0;
            const lines = [];
            for (const tier of tiers) {
                const qty = wanted.get(tier.id);

                if (tier.sale_start && new Date(tier.sale_start) > now) {
                    throw new HttpError(400, `Sales for "${tier.name}" have not started yet`);
                }
                if (tier.sale_end && new Date(tier.sale_end) < now) {
                    throw new HttpError(400, `Sales for "${tier.name}" have ended`);
                }
                if (tier.quota - tier.sold < qty) {
                    throw new HttpError(409, `Not enough "${tier.name}" tickets left (${Math.max(tier.quota - tier.sold, 0)} available)`);
                }

                const subtotal = tier.price * qty;
                total += subtotal;
                lines.push({ tier, qty, subtotal });
            }

            // the hold
            for (const line of lines) {
                await line.tier.update({ sold: line.tier.sold + line.qty }, { transaction: t });
            }

            const order = await OrderTicket.create({
                user_id: req.user.id,
                concert_id: concertId,
                status: 'pending',
                total_price: total,
                expires_at: new Date(Date.now() + config.order.expiryMinutes * 60 * 1000)
            }, { transaction: t });

            await OrderDetail.bulkCreate(lines.map((l) => ({
                order_id: order.id,
                ticket_tier_id: l.tier.id,
                quantity: l.qty,
                unit_price: l.tier.price,
                subtotal: l.subtotal
            })), { transaction: t });

            return order;
        })
        const order = await OrderTicket.findByPk(created.id, { include: orderInclude });
        return success(res, withTimer(order), 'Order created, please pay before it expires', 201);
    } catch (err) {
     return error(res, err.message, err.status || 500);
    }
} 