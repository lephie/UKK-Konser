import { Notification } from "../models/index.js";
import { getPagination, paginated } from "../utils/pagination.js"
import { success } from "../utils/response";


export const getNotification = async (req, res) => {
    try {
        const {page, limit, offset} = getPagination(req.query, 20);
        const where = {user_id: req.user.id};
        if(req.query.unread === 'true') where.is_read === false;

        const {rows, count} = await Notification.findAndCountAll({
            where,
            order: [['created_at', 'DESC'], ['id', 'DESC']],
            limit,
            offset
        });

        return success(res, paginated(rows, count, page, limit), 'Notification fetched');
    } catch (err) {
        return error(res, err.message, 500)
    }
}

export const getUnread = async (req, res) => {
    try {
        const unread = await Notification.count({ where: {user_id: req.user.id, is_read: false}});
        return success(res, {unread}, 'Unread count fetched')
    } catch (err) {
        return error(res, err.message, 500);
    }
}

export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({where: {id: req.params.id, user_id: req.user.id}})
        if(!notification) return error(res, 'Notification not found', 404 )
        
        await notification.update({is_read: true});
        return success(res, notification, 'Notification marked as read');

    } catch (err) {
        return error(res, err.message, 500);
    }
}

export const markAllAsRead = async (req, res) => {
    try {
        const [changed] = await Notification.update(
            {is_read: true},
            {where: {user_id: req.user.id, is_read: false}}
        );

        return success(res, {updated: changed}, 'All notification marked as read');
    } catch (err) {
        return error(res, err.message, 500);
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({where: {id: req.params.id, user_id: req.user.id}});
        if(!notification) return error(res, 'Notification not found', 404)
        
        await notification.destroy();
        return success(res, null, 'Notification deleted');
    } catch (err) {
        return error(res, err.message, 500)
    }
}