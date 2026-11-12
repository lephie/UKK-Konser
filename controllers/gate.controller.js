import { toDefaultValue } from "sequelize/lib/utils";
import { Ticket } from "../models";
import { findOwnedConcert } from "../services/concert.service";
import { success } from "../utils/response";


export const scanTicket = async (req, res) => {
    try {
        const qrCode = String(req.body?.qr_code ?? '').trim();
        if(!qrCode) return error(res, 'qr code is required', 400);

        const ticket = await Ticket.findOne({
            where: {qrCode},
            include: [
                { model: Concert, as: 'concert', attributes: ['id', 'title', 'date', 'status', 'created_by'] },
                { model: TicketTier, as: 'tier', attributes: ['id', 'name'] },
                { model: User, as: 'owner', attributes: ['id', 'name'] }
            ]
        });

        if(!ticket) return error(res, 'Invalid ticket, QR code didnt recognized ', 400 )
        if(ticket.concert.created_by !== req.user.id) return error(res, 'Invalid ticket, this ticket id for another event ', 403);

        if(ticket.status === 'cancelled' || ticket.concert.status === 'cancelled') return error(res, 'This event was cancelled', 400)
        
        if(ticket.status === 'used'){
            return res.status(409).json({
                status: 'error',
                message: 'Ticket already used',
                data: {check_in_at: ticket.check_in_at}
            });
        }

        const checkInAt = new Date();
        const [changed] = await Ticket.update(
            { status: 'used', check_in_at: checkInAt, checked_in_by: req.user.id },
            { where: { id: ticket.id, status: 'unused' } }
        );
        if (changed === 0) return error(res, 'Ticket already used: entry denied', 409);

        return success(res, {
            ticket_id: ticket.id,
            holder: ticket.owner.name,
            tier: ticket.tier.name,
            concert: ticket.concert.title,
            check_in_at: checkInAt
        }, 'Valid ticket: entry granted');
    } catch (err) {
        console.error(res, err.message, 500)
    }
}

export const getCheckinCount = async (res, req) => {
   
   try {
       const concert = await findOwnedConcert(req.params.id, req.user.id);
              if(!concert) return error(res, 'Concert not found', 404);
           
           // fitur cek tiket yang udah di checkin dan belum, lalu total tiket berapa (totalvalidticket)
           const [checkIn, notYet] = await Promise.all([
               Ticket.count({where: {concert_id: concert.id, status: 'used'}}),
               Ticket.count({where: {concert_id: concert.id, status: 'unused'}})
           ])
       
           return success(res, {
               concert_id: concert.id,
               title: concert.title,
               checked_in: checkIn,
               not_arriving_yet: notYet,
               total_valid_ticket: checkIn + notYet
           },'Chekin count fetched');
   } catch (err) {
    console.error(res, err.message, 500)
    } 

} 