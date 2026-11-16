import { expirePendingOrders } from '../services/order.service.js';

let timer = null;

// Every minute: pending orders past expires_at -> 'expired', and their held quota goes back to the tiers.
export const startOrderExpiryJob = (intervalMs = 60 * 1000) => {
    if (timer) return;

    const run = async () => {
        try {
            const count = await expirePendingOrders();
            if (count > 0) console.log(`[orderExpiry] expired ${count} order(s)`);
        } catch (err) {
            console.error('[orderExpiry] job failed:', err.message);
        }
    };

    run(); // clean up anything that expired while the server was down
    timer = setInterval(run, intervalMs);
};

export const stopOrderExpiryJob = () => {
    if (timer) clearInterval(timer);
    timer = null;
};
