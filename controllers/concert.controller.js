import { Op } from "sequelize";
import { Concert, User, TicketTier, OrderTicket } from "../models/index.js";
import {success, error} from "../utils/response.js";
import {cancelOrder} from "../services/order.service.js"
import { dateValidate } from "../utils/validate.js";
import { getPagination, paginated } from "../utils/pagination";
import { findOwnedConcert, presentConcert } from "../services/concert.service";
import { notifyMany } from "../services/notification.service.js";


export const getAllConcert = async (req, res) => {
    try {
        const {page, limit, offset} = getPagination(req.query);
        const {search, location, date_from, date_to} = req.query

        const dateFilter = {[Op.gte]: new Date()}; // gte = greater than / equal >=
        if(date_from){
            const from = dateValidate(date_from)
            if(form == undefined) return error(res, "date_from not valid date", 400);
            if(from > dateFilter[Op.gte]) dateFilter[Op.gte] = from;
        }

        if(date_to){
            const to = dateValidate(date_to)
            if(to == undefined) return error(res, "date_to not valid date", 400);
            dateFilter[Op.lte] // less than / equal <=
        }

        const where = {status: 'published', date: dateFilter};
        if(search){
            where[Op.like] = [
                {title:         {[Op.like]: `%${search}%`}},
                {description:   {[Op.like]: `%${search}%`}},
                {venue:         {[Op.like]: `%${search}%`}}
            ]; // like = seperti? jadi samakan search dengan / like description / title / venue, jadi semua kecari?
        }
        if (location) where.location = {[Op.like] : `%${location}%`};

        const { rows, count } = await Concert.findAndCountAll({
            where,
            include: [
                {model: User, as: 'organizer', attributes: ['id', 'name']},
                {model: TicketTier, as: 'tiers', attributes: ['id', 'name', 'price', 'quota', 'sold', 'sale_start', 'sale_end']}
            ],
            order: [['date', 'ASC']],
            distinct: true, // remove duplicate rows?
            limit,
            offset
        });

        return success(res, paginated(rows.map(presentConcert), count, page, limit), "Concert Fetched" )
        // present concert nunjukin concert yang ada

    } catch (err) {
        return error(res, err.message, 500)
    }
};

export const getConcertById = async (req, res) => {
    try {
        const concert = await Concert.findOne({
            where: {id: req.params.id, status: 'published'},
            include: [
                { model: User, as: 'organizer', attributes: ['id', 'name']},
                { model: TicketTier, as: 'tiers', attributes: ['id', 'name', 'price', 'quota', 'sold', 'sale_start', 'sale_end']}
            ]
        });
        if(!concert) return error(res, "Error concert not found", 404);

        return success(res, presentConcert(concert), 'Concert Fetched');
    } catch (err) {
        return error(res, err.message, 500);
    }
};

// fitur fitur EOEOEOEO

export const getMyConcert = async (req, res) =>{
    try {
        const {page, limit, offset} = getPagination(req.query);
        const where = {created_by: req.user.id};
        if(req.query.status) where.status = req.query.status;

        const {rows, count} = await Concert.findAndCountAll({
            where, 
            include: [{model: TicketTier, as: 'tiers', attributes: ['id', 'names', 'price', 'quota', 'sold']}],
            order: [['created_at', 'DESC']],
            distinct: true,
            limit,
            offset
        });
        return success(res, paginated(rows.map(presentConcert), count, page, limit), 'Your Concert Fetched')

    } catch (err) {
        return error(res, err.message, 500);
    }
};


export const getMyConcertById = async (req, res) =>{
    try {
        const concert = await findOwnedConcert(req.params.id, req.user.id,{
            include: [{model: TicketTier, as: 'tiers'}]
        });
        if(!concert) return error(res, 'Concert not found', 404);

        return success(res, presentConcert(concert), 'Concert fetched');
    } catch (err) {
        console.error(res, err.message, 500)
    }
}

export const updateConcert = async (req, res) =>{
    try {
        const concert = await findOwnedConcert(req.params.id, req.user.id);
        if(!concert) return error(res, 'Concert not found', 404)
        if(concert.status === 'cancelled') return error(res, 'This concert already cancelled, cannot be edited', 400);

        const body = req.body ?? {};
        const updates = {};
        for(const field of ['title', 'description', 'venue', 'location', 'banner_url']){
            if(body[field] !== undefined) updates[field] = body[field];
        }
        if(body.date !== undefined){
            const date = dateValidate(body.date);
            if(!date) return error(res, 'date is not valid date', 400);
            if(date <= new Date()) return error(res, 'date must be for future concert', 400);
            updates.date = date;
        }
        if(Object.keys(updates).length === 0) return error(res, 'Nothing to update', 400);

        const scheduleChanged = 
        (updates.date && updates.date.getTime() !== new Date(concert.date).getTime()) ||
        (updates.venue && updates.venue !== concert.venue) ||
        (updates.location && updates.location !== concert.location);

        await concert.update(updates);

        // notif buat yang udah beli timket
        if(scheduleChanged && concert.status === 'published'){
            const buyers = await OrderTicket.findAll({
                where: {concert_id: concert.id, status: 'paid'},
                attributes: ['user_id'],
                group: ['user_id'],
                raw: true
            });
            await notifyMany(
                buyers.map((b) => b.user_id),
                'Concert detail changed',
                `The schedule or venue of "${concert.title}" was updated. Please check your current page.`
            );
        }

        return success(res, concert, 'Concert updated');
    } catch (err) {
        return error(res, res.message, 500);
    }
};

export const publishConcert = async (req, res) =>{
    try {
        const concert = await findOwnedConcert(req.params.id, req.user.id);
        if(!concert) return error(res, 'Concert not found', 404);
        if(concert.status === 'published') return error(res, 'This concert already published', 400);
        if(concert.status === 'cancelled') return error(res, 'This concert was cancelled, cannot be published', 400);
        if(new Date(concert.date) <= new Date()) return error(res, 'Concert date was in the past, update the data first', 400);
        
        const tiers = await TicketTier.count({where: {concert_id: concert.id} });
        if(tiers === 0) return error(res, 'Add at least one ticket tier before publishing', 400);

        await concert.update({status: 'published'});
        return success(res, concert, 'Concert published');

    } catch (err) {
        return error(res, err.message, 500)
    }
}

export const cancelConcert = async (res, req) =>{
    try {
        const concert = findOwnedConcert(req.params.id, req.user.id)
        if(!concert) return error(res, 'Concert not found', 404);
        if(concert.status === 'cancelled') return error(res, 'Concert already cancelled', 400);

        const wasPublished = concert.status = 'published';
        
        // update ke cancel status
        await concert.update({status: 'cancelled'});

        //cancel langsun yang masih unpaid/pending
        if(wasPublished) {
            const pending = await OrderTicket.findAll({
                where: {concert_id: concert.id, status: 'pending'},
                attributes: ['id']
            });
            for (const o of pending ) await cancelOrder(o.id);

            await Ticket.update({ status: 'cancelled' }, {where: { concert_id: concert.id, status: 'unused'} });

            const buyers = await OrderTicket.findAll({
                where: {concert_id: concert.id, status: 'paid'},
                attributes: ['user_id'],
                group: ['user_id'],
                raw: true
            });
            await notifyMany(
                buyers.map((b) => b.user_id),
                'Concert cancelled',
                `"${concert.title}" has been cancelled by organizer. The organizer will contact you for a refund`
            );
        }

        return success(res, concert, 'Concert cancelled');

    } catch (err) {
        console.error(res, err.message, 500)
    }
}

export const deleteConcert = async (res, req) =>{
    try {
        const concert = await findOwnedConcert(req.params.id, req.user.id);
        if(!concert) return error(res, "Concert not found", 404);

        const paidConcert = await OrderTicket.findOne({where: {concert_id: concert.id, status: 'paid'}});
        if(paidConcert) return error(res, 'This concert already has paid orders, cancel it instead of deleting', 409);

        await concert.destroy();
        return success(res, null, 'Concert Deleted');
    } catch (err) {
        console.error(res, err.message, 500)
    }
}


