import OrderTicket from "../models/order-ticket.models.js";
import { applyPaymentResult } from "../services/order.service.js";
import { createSnapTransaction, getTransactionStatus, redirectUrl, verifySignature } from "../services/payment.service.js";
import { error, success } from "../utils/response.js";


export const pay = async (req, res) =>{
    try {
        const order = req.order;
        if(order.status === 'pending') return error(res, `Order ${order.status}, it cannot be paid`, 400);

        if(order.payment_token) {
            return success(res, paymentLoad(order, order.payment_token, 'Payment ready'))
        }

        const concertTitle = order.concert?.title ?? 'Concert';
        const items = order.details.map((d) => ({
            id: `TIER-${d.ticket_tier_id}`,
            price: d.unit_price,
            quantity: d.quantity,
            name: `${d.tier?.name ?? 'Ticket'} - ${concertTitle}`
        }));

        const paymentRef = `ORD-${order.id}-${Date.now()}`;
        const minutesLeft = Math.max(1, Math.ceil((new Date(order.expired_at) - Date.now()) / 60000))

        const trx = await createSnapTransaction({
            paymentRef,
            order,
            user: req.user,
            items,
            expiryMinutes: minutesLeft
        });

        const [saved] = await OrderTicket.update(
            {payment_token: trx.token, paymentRef: paymentRef},
            {where: {id: order.id, payment_token: null}}
        );
        if(!saved) await order.reload(); // might be caused something err?
        return success(res, paymentLoad(order, saved ? trx.token : order.payment_token), 'Payment Ready')
    } catch (err) {
        console.error(res, `Could not create the payment : ${err.message}`, 502);
    }
} 

const paymentLoad = (order, token) => ({
    order_id: order.id,
    total_price: order.total_price,
    expired_at: order.expired_at,
    token,
    redirect_url: redirectUrl(token)
});

export const checkStatus = async (req, res) => {
    try {
        const order = req.order;
        if(order.status === 'pending' && order.payment_ref){
            try {
                const payload = await getTransactionStatus(order.payment_ref)
                await applyPaymentResult(payload)
            } catch (error) {
                
            }
        }

        const fresh = await OrderTicket.findByPk(order.id);
        return success(res, {
            order_id: fresh.id,
            order_status: fresh.status,
            payment_method: fresh.payment_method,
            expires_at: fresh.expired_at
        }, 'Order status fetched');
    } catch (err) {
        return error(res, err.message, 500 )
    }
}

export const notification = async (req, res) => {
    try {
        const body = req.body ?? {};
        if(!verifySignature(body)) return error(res, 'Invalid signature', 403);
        return res.status(200).json({status: 'ok'});
    } catch (err) {
        console.error('[payment] webhook failed: ', err);
        return error(res, 'Webhook processing failed', 500);
    }
};