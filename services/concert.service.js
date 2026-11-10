import { Concert } from "../models/index.js";

export const presentConcert = (concert) =>{
    const c = typeof concert.get === 'function' ? concert.get({ plain: true }) : concert;
    if(Array.isArray(c.tiers)) c.tiers = c.tiers.map(presentTier);
    return c ;
}

export const presentTier = (tier) =>{
    const t = typeof tier.get === 'function' ? tier.get({plain: true}) : tier;
    const now = new Date();
    const available = Math.max(t.quota - t.sold, 0);

    let sale_status = 'on_sale';
    if(available === 0) sale_status = 'sold_out';
    else if(t.sale_start && new Date(t.sale_start) > now) sale_status = 'upcoming';
    else if(t.sale_end && new Date(t.sale_end) < now) sale_status = 'ended';

    return {...t, available, sale_status};
}

export const findOwnedConcert = (concertId, userId, options = {}) =>
    Concert.findOne({where: {id: concertId, created_by: userId}, ...options })

export default {presentConcert, presentTier, findOwnedConcert }