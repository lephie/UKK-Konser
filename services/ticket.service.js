import { Ticket } from '../models/index.js';
import { generateQRString } from '../utils/generateQr.js';

// One ticket (with its own unique QR string) per quantity in each order line.
export const issueTickets = (order, details, transaction) => {
    const rows = [];
    for (const d of details) {
        for (let i = 0; i < d.quantity; i++) {
            rows.push({
                order_detail_id: d.id,
                user_id: order.user_id,
                concert_id: order.concert_id,
                ticket_tier_id: d.ticket_tier_id,
                qr_code: generateQRString(),
                status: 'unused'
            });
        }
    }
    return Ticket.bulkCreate(rows, { transaction });
};

export default { issueTickets };
