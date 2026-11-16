import { Op } from 'sequelize';
import { sequelize, Concert, OrderTicket, OrderDetail, TicketTier } from '../models/index.js';
import { issueTickets } from './ticket.service.js';
import { createNotifications } from './notification.service.js';
import { mapTransactionState } from './payment.service.js';

 const sortedDetails = (orderId, transaction) =>
    OrderDetail.findAll({ where: {order_id: orderId}, order: [['ticket_tier_id', 'ASC']], transaction})

 const releaseQuota = async (details, transaction) => {
    for (const d of details ){
        await TicketTier.decrement('sold', {
            by: d.quantity,
            where: {id: d.ticket_tier_id},
            transaction
        });
    }
 };

 const closePendingOrder = (orderId, newStatus, notice) =>
    sequelize.transaction(async (t) =>{
        const order = await OrderTicket.findByPk(orderId, {lock: t.LOCK.UPDATE, transaction: t});
        if(!order || order.status !== 'pending') return null ;

        const details = await sortedDetails(order.id, t);
        await releaseQuota(details, t);
        await order.update({status: newStatus}, {transaction: t});

        if(notice) {
            await createNotifications(order.user_id, notice.title, notice.message(order), {transaction: t});
        }
        return order;
    })

export const expireOrder = (orderId) =>
    closePendingOrder(orderId, 'expired', {
        title: 'Order expired',
        message: (o) => `Order #${o.id} was not paid in time and has been released.`
    });


export const cancelOrder = (orderId) => 
    closePendingOrder(orderId, 'cancelled', {
        title: 'Order cancelled',
        message: (o) => `Order #${o.id} has been cancelled.`
    });



export const expirePendingOrders = async () => {
    const stale = await OrderTicket.findAll({
        where: { status: 'pending', expires_at: { [Op.lte]: new Date() } },
        attributes: ['id'],
        limit: 200
    });

    let count = 0;
    for (const o of stale) {
        const closed = await expireOrder(o.id);
        if (closed) count++;
    }
    return count;
};

// A payment arrived for an order that had already expired/been cancelled.
// Try to take the quota again; if the tickets are gone we can't honour it.
const reserveAgain = async (order, details, t) => {
    const concert = await Concert.findByPk(order.concert_id, { transaction: t });
    if (!concert || concert.status !== 'published') return false;

    const tiers = await TicketTier.findAll({
        where: { id: details.map((d) => d.ticket_tier_id) },
        order: [['id', 'ASC']],
        lock: t.LOCK.UPDATE,
        transaction: t
    });
    const byId = new Map(tiers.map((x) => [x.id, x]));

    for (const d of details) {
        const tier = byId.get(d.ticket_tier_id);
        if (!tier || tier.quota - tier.sold < d.quantity) return false;
    }
    for (const d of details) {
        await TicketTier.increment('sold', { by: d.quantity, where: { id: d.ticket_tier_id }, transaction: t });
    }
    return true;
};

// Called by the Midtrans webhook AND by GET /orders/:id/status.
// `payload` is the Midtrans notification / status response. It is idempotent: Midtrans may send the same
// notification several times, and an order that is already paid is simply left alone.
export const applyPaymentResult = async (payload) => {
    const state = mapTransactionState(payload);
    if (state === 'pending' || state === 'ignore') return { handled: false, state };

    return sequelize.transaction(async (t) => {
        const order = await OrderTicket.findOne({
            where: { payment_ref: payload.order_id },
            lock: t.LOCK.UPDATE,
            transaction: t
        });
        if (!order) return { handled: false, state, reason: 'order_not_found' };
        if (order.status === 'paid') return { handled: false, state, reason: 'already_paid' };

        const details = await sortedDetails(order.id, t);

        if (state === 'paid') {
            // never trust the status alone: the amount paid must match the order
            if (Number(payload.gross_amount) !== Number(order.total_price)) {
                console.error(`[payment] amount mismatch on order ${order.id}: paid ${payload.gross_amount}, expected ${order.total_price}`);
                return { handled: false, state, reason: 'amount_mismatch' };
            }

            if (order.status !== 'pending') {
                const reserved = await reserveAgain(order, details, t);
                if (!reserved) {
                    console.error(`[payment] order ${order.id} was paid after it expired and the tickets are gone: refund needed`);
                    await createNotifications(
                        order.user_id,
                        'Payment received after the order expired',
                        `We received your payment for order #${order.id} after it expired and the tickets are no longer available. Please contact support for a refund.`,
                        { transaction: t }
                    );
                    return { handled: false, state, reason: 'paid_after_expiry_sold_out' };
                }
            }

            await order.update(
                { status: 'paid', payment_method: payload.payment_type ?? null },
                { transaction: t }
            );
            await issueTickets(order, details, t);
            await createNotifications(
                order.user_id,
                'Payment successful',
                `Order #${order.id} is paid. Your tickets are ready in "My Tickets".`,
                { transaction: t }
            );
            return { handled: true, state: 'paid' };
        }

        // failed or expired at Midtrans
        if (order.status !== 'pending') return { handled: false, state, reason: 'order_not_pending' };

        await releaseQuota(details, t);
        const newStatus = state === 'expired' ? 'expired' : 'cancelled';
        await order.update({ status: newStatus }, { transaction: t });
        await createNotifications(
            order.user_id,
            state === 'expired' ? 'Payment expired' : 'Payment failed',
            `The payment for order #${order.id} ${state === 'expired' ? 'expired' : 'failed'} and the order was ${newStatus}.`,
            { transaction: t }
        );
        return { handled: true, state: newStatus };
    });
};


export default { expireOrder, cancelOrder, expirePendingOrders, applyPaymentResult };
