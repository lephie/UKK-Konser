import sequelize from "../config/database.js";


import User from "./users.models.js";
import Ticket from "./ticket.models.js";
import TicketTier from "./ticket-tier.models.js";
import OrderTicket from "./order-ticket.models.js";
import OrderDetail from "./order-detail.models.js";
import Notification from "./notification.models.js";
import Concert from "./concert.models.js";



// user 
User.hasMany( Concert, {foreignKey: 'created_by'})
User.hasMany( OrderTicket, {foreignKey: 'user_id' })
User.hasMany( Ticket, {foreignKey: 'user_id' })
User.hasMany( Notification, {foreignKey: 'user_id' })

// concert
Concert.belongsTo(User ,{foreignKey: 'created_by', as:'organizer'})
Concert.hasMany(TicketTier ,{foreignKey: 'user_id'})
Concert.hasMany(OrderTicket ,{foreignKey: 'user_id'})
Concert.hasMany(Ticket ,{foreignKey: 'user_id'})

// orderticket
OrderTicket.belongsTo(User ,{foreignKey: 'user_id'})
OrderTicket.belongsTo(Concert ,{foreignKey: 'concert_id'})
OrderTicket.hasMany(OrderDetail ,{foreignKey: 'order_id'})

//order detail
OrderDetail.belongsTo(OrderTicket ,{foreignKey: 'order_id'})
OrderDetail.belongsTo(TicketTier ,{foreignKey: 'ticket_tier_id'})
OrderDetail.hasMany(Ticket ,{foreignKey: 'ticket_detail_id'})

// ticket 
Ticket.belongsTo(OrderDetail ,{foreignKey: 'order_detail_id'})
Ticket.belongsTo(User ,{foreignKey: 'check_out_by', as:'checkInBy'})
Ticket.belongsTo(User ,{foreignKey: 'user_id'})
Ticket.belongsTo(Concert ,{foreignKey: 'concert_id'})
Ticket.belongsTo(TicketTier ,{foreignKey: 'ticket_tier_id'})

Notification.belongsTo(User, {foreignKey: 'user_id'})

export {
  sequelize,
  User,
  Concert,
  TicketTier,
  OrderTicket,
  OrderDetail,
  Ticket,
  Notification
}