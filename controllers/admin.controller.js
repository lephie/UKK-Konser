import { Concert, OrderTicket } from "../models";
import User from "../models/users.models";
import {success, error} from '../utils/response.js';



export const getAllUser = async (req, res) => {
    try {
        const users = await User.findALL({
            where : {role : 'user'},
            attributes : {exclude : ['password']}
        });
        return success(res, users, 'User fetched !!')
    } catch (error) {
        return error(res, error.message, 500)
    }
}

// activate/deactive
export const statusUser = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {id: req.params.id, role: 'user'}
        });

        if (!user) return error(res, 'User not found', 404);

        user.is_active = !user.is_active
        await user.save();

        const status = user.is_active ? 'activated' : 'deactivated' ;
        return success(res, {id: user.id, is_active: user.is_active}, `User ${status} Succesfully`)

    } catch (error) {
        return error(res, error.message, 500)
    }
}

export const getAllEO = async (req, res) => {
    try {
        const eo = await User.findAll({
            where : {role: 'event_organizer'},
            attributes : {exclude : ['password']}
        });
        return success(res, eo, 'EO fetched !!')
    } catch (error) {
        return error(res, error.message, 500)
    }
}

export const approveEO = async (req, res) => {
    try {
        const eo = await User.findOne({
            where : {id: req.params.id, role: 'event_organizer'}
        });

        if(!eo) return error(res, 'Event Organizer not found', 404)
        if(eo.is_active) return error(res, 'Event Organizer already approved', 400)
        
        eo.is_active = true;
        await eo.save();

        return success(res, {id: eo.id, is_active: eo.is_active}, 'Event Organizer Approved')

    } catch (error) {
        return error(res, error.message, 500)
    }
}

export const rejectEO = async (req, res) => {
    try {
        const eo = await User.findOne({
            where : {id: req.params.id, role: 'event_organizer'}
        });

        if(!eo) return error(res, 'Event Organizer not found', 404)
        if(!eo.is_active) return error(res, 'Event Organizer already inactive', 400)
        
        eo.is_active = false;
        await eo.save();

        return success(res, {id: eo.id, is_active: eo.is_active}, 'Event Organizer Rejected')
    } catch (error) {
        return error(res, error.message, 500)
    }
}

export const getAllConcert = async (req, res) => {
    try {
        const concert = await Concert.findAll({
            include: [
                {
                    model: User,
                    as: 'organizer',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: TicketTier,
                    attributes : ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']]
        })
        return success(res, concert, 'Concert fetched successfully')
    } catch (error) {
        return error(res, error.message, 500)
    }
}

export const removeConcert = async (req, res) => {
    try {
        const concert = await Concert.findByPk(req.params.id);

        if(!concert) return error(res, 'Concert not found', 404);

        const paidOrders = await OrderTicket.findOne({
            where: {concert_id: req.param.id, status: 'paid'}
        });

        if(paidOrders) return error(res, 'Cannot delete concert with existing paid orders', 404);
        await concert.destroy();
        return success(res, null, 'Concert remove successfully')
    } catch (error) {
        return error(res, error.message, 500)
    }
}