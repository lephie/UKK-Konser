import sequelize from "../config/database.js";
import Ticket from "./ticket.models.js";
import TicketTier from "./ticket-tier.models.js";
import OrderTicket from "./order-ticket.models.js";
import OrderDetail from "./order-detail.models.js";
import Notification from "./notification.models.js";
import User from "./users.models.js";
import Concert from "./concert.models.js";


// user
User.hasMany(Concert,      { foreignKey: 'created_by', as: 'concerts' });
User.hasMany(OrderTicket,  { foreignKey: 'user_id',    as: 'orders' });
User.hasMany(Ticket,       { foreignKey: 'user_id',    as: 'tickets' });
User.hasMany(Notification, { foreignKey: 'user_id',    as: 'notifications' });

// concert
Concert.belongsTo(User,     { foreignKey: 'created_by', as: 'organizer' });
Concert.hasMany(TicketTier, { foreignKey: 'concert_id', as: 'tiers' });
Concert.hasMany(OrderTicket,{ foreignKey: 'concert_id', as: 'orders' });
Concert.hasMany(Ticket,     { foreignKey: 'concert_id', as: 'tickets' });

// ticket tier
TicketTier.belongsTo(Concert,    { foreignKey: 'concert_id',     as: 'concert' });
TicketTier.hasMany(OrderDetail,  { foreignKey: 'ticket_tier_id', as: 'orderDetails' });
TicketTier.hasMany(Ticket,       { foreignKey: 'ticket_tier_id', as: 'tickets' });

// order ticket
OrderTicket.belongsTo(User,      { foreignKey: 'user_id',    as: 'user' });
OrderTicket.belongsTo(Concert,   { foreignKey: 'concert_id', as: 'concert' });
OrderTicket.hasMany(OrderDetail, { foreignKey: 'order_id',   as: 'details' });

// order detail
OrderDetail.belongsTo(OrderTicket, { foreignKey: 'order_id',        as: 'order' });
OrderDetail.belongsTo(TicketTier,  { foreignKey: 'ticket_tier_id', as: 'tier' });
OrderDetail.hasMany(Ticket,        { foreignKey: 'order_detail_id', as: 'tickets' });

// ticket
Ticket.belongsTo(OrderDetail, { foreignKey: 'order_detail_id', as: 'detail' });
Ticket.belongsTo(User,        { foreignKey: 'user_id',         as: 'owner' });
Ticket.belongsTo(User,        { foreignKey: 'checked_in_by',   as: 'checkedInBy' });
Ticket.belongsTo(Concert,     { foreignKey: 'concert_id',      as: 'concert' });
Ticket.belongsTo(TicketTier,  { foreignKey: 'ticket_tier_id',  as: 'tier' });

// notification
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  User,
  Concert,
  TicketTier,
  OrderTicket,
  OrderDetail,
  Ticket,
  Notification
};

export default {
  sequelize,
  User,
  Concert,
  TicketTier,
  OrderTicket,
  OrderDetail,
  Ticket,
  Notification
};