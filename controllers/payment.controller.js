import { applyPaymentResult } from "../services/order.service.js";
import { redirectUrl } from "../services/payment.service.js";
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

        const trx = await createSnap
    } catch (err) {
        
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

        if(order.status === 'pending' && order.payment_ref);
        await applyPaymentResult(payload)
    } catch (err) {
        
    }
}