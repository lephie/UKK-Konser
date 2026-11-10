import { Notification } from "../models"

export const createNotifications = (userId, title, message, options = {}) =>
    Notification.create({user_id: userId, title, message}, options);

// need to learn about this line
export const notifyMany = (userIds, title, message, options = {}) => {
    const unique = [...new Set(userIds)];
    if(unique.lenght === 0) return Promise.resolve([]);
    return Notification.bulkCreate(
        unique.map((id) => ({ user_id: id, title, message })),
        options
    );
};

export default {createNotifications, notifyMany}