import { DataTypes } from 'sequelize';
import Sequelize from 'sequelize';

const OrderTicket = Sequelize.define('OrderTicket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  concert_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'expired'),
    defaultValue: 'pending'
  },
  total_price: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  payment_method: {
    type: DataTypes.STRING(60),
    allowNull: true
  },
  payment_token: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'order_ticket',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false  // your SQL has no updated_at on this table
});

export default OrderTicket;