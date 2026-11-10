import { OrderDetail, OrderTicket, sequelize, TicketTier } from "../models/index.js"
import { createNotifications } from "./notification.service.js";

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


 const cancelOrder = (orderId) => 
    closePendingOrder(orderId, 'cancelled', {
        title: 'Order cancelled',
        message: (o) => `Order #${o.id} has been cancelled.`
    });

export default {cancelOrder, closePendingOrder, releaseQuota, sortedDetails}