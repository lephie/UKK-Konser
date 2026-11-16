import { Concert, TicketTier, OrderDetail, sequelize } from '../models/index.js';
import { findOwnedConcert, presentTier } from '../services/concert.service.js';
import { success, error } from '../utils/response.js';
import { HttpError } from '../utils/HttpError.js';
import { missingFields, dateValidate } from '../utils/validate.js';

// Checks a price / quota / sale window and returns { values } or { problem }
const validateTierFields = (input, concert, current = {}) => {
    const values = {};

    if (input.name !== undefined) {
        if (!String(input.name).trim()) return { problem: 'name cannot be empty' };
        values.name = String(input.name).trim();
    }
    if (input.price !== undefined) {
        const price = Number(input.price);
        // Midtrans (IDR) works with whole rupiah amounts, and free tickets don't go through a payment
        if (!Number.isInteger(price) || price <= 0) return { problem: 'price must be a whole number greater than 0' };
        values.price = price;
    }
    if (input.quota !== undefined) {
        const quota = Number(input.quota);
        if (!Number.isInteger(quota) || quota < 1) return { problem: 'quota must be a whole number of at least 1' };
        values.quota = quota;
    }
    if (input.sale_start !== undefined) {
        const d = dateValidate(input.sale_start);
        if (d === undefined) return { problem: 'sale_start is not a valid date' };
        values.sale_start = d;
    }
    if (input.sale_end !== undefined) {
        const d = dateValidate(input.sale_end);
        if (d === undefined) return { problem: 'sale_end is not a valid date' };
        values.sale_end = d;
    }

    const start = 'sale_start' in values ? values.sale_start : current.sale_start;
    const end = 'sale_end' in values ? values.sale_end : current.sale_end;
    if (start && end && new Date(end) <= new Date(start)) return { problem: 'sale_end must be after sale_start' };
    if (end && new Date(end) > new Date(concert.date)) return { problem: 'sale_end cannot be after the concert date' };

    return { values };
};

export const createTier = async (req, res) => {
    try {
        const concert = await findOwnedConcert(req.params.concertId, req.user.id);
        if (!concert) return error(res, 'Concert not found', 404);
        if (concert.status === 'cancelled') return error(res, 'Cannot add tiers to a cancelled concert', 400);

        const body = req.body ?? {};
        const missing = missingFields(body, ['name', 'price', 'quota']);
        if (missing.length) return error(res, `Missing fields: ${missing.join(', ')}`, 400);

        const { values, problem } = validateTierFields(body, concert);
        if (problem) return error(res, problem, 400);

        const tier = await TicketTier.create({ ...values, concert_id: concert.id, sold: 0 });
        return success(res, presentTier(tier), 'Ticket tier created', 201);
    } catch (err) {
        return error(res, err.message, 500);
    }
};

export const getTiers = async (req, res) => {
    try {
        const concert = await findOwnedConcert(req.params.concertId, req.user.id);
        if (!concert) return error(res, 'Concert not found', 404);

        const tiers = await TicketTier.findAll({ where: { concert_id: concert.id }, order: [['price', 'ASC']] });
        return success(res, tiers.map(presentTier), 'Ticket tiers fetched');
    } catch (err) {
        return error(res, err.message, 500);
    }
};

// a tier, only if it belongs to a concert of this EO
const findOwnedTier = (tierId, userId) =>
    TicketTier.findOne({
        where: { id: tierId },
        include: [{ model: Concert, as: 'concert', where: { created_by: userId } }]
    });

export const updateTier = async (req, res) => {
    try {
        const owned = await findOwnedTier(req.params.id, req.user.id);
        if (!owned) return error(res, 'Ticket tier not found', 404);
        if (owned.concert.status === 'cancelled') return error(res, 'Cannot edit tiers of a cancelled concert', 400);

        const body = req.body ?? {};

        const tier = await sequelize.transaction(async (t) => {
            // lock the row: `sold` can change at any moment while people are buying
            const locked = await TicketTier.findByPk(owned.id, { lock: t.LOCK.UPDATE, transaction: t });

            const { values, problem } = validateTierFields(body, owned.concert, locked);
            if (problem) throw new HttpError(400, problem);
            if (Object.keys(values).length === 0) throw new HttpError(400, 'Nothing to update');
            if (values.quota !== undefined && values.quota < locked.sold) {
                throw new HttpError(400, `quota cannot be lower than the ${locked.sold} tickets already sold or held`);
            }

            await locked.update(values, { transaction: t });
            return locked;
        });

        return success(res, presentTier(tier), 'Ticket tier updated');
    } catch (err) {
        return error(res, err.message, err.status || 500);
    }
};

export const deleteTier = async (req, res) => {
    try {
        const owned = await findOwnedTier(req.params.id, req.user.id);
        if (!owned) return error(res, 'Ticket tier not found', 404);

        const used = await OrderDetail.count({ where: { ticket_tier_id: owned.id } });
        if (used > 0 || owned.sold > 0) {
            return error(res, 'This tier already has orders, it cannot be deleted', 409);
        }

        await owned.destroy();
        return success(res, null, 'Ticket tier deleted');
    } catch (err) {
        return error(res, err.message, 500);
    }
};
