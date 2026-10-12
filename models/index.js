import sequelize from "../config/database";


import User from "./users.models";
import Ticket from "./ticket.models";
import TicketTier from "./ticket-tier.models";
import OrderTicket from "./order-ticket.models";
import OrderDetail from "./order-detail.models";
import Notification from "./notification.models";
import Concert from "./concert.models";
import { forwardRef } from "react";
import { TICK_CHAR } from "sequelize/lib/utils";


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