import { DataTypes } from 'sequelize';
import Sequelize from 'sequelize';

const OrderDetail = Sequelize.define('OrderDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ticket_tier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  unit_price: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL,
    allowNull: true
  }
}, {
  tableName: 'order_detail',
  timestamps: false  // your SQL has no timestamps on this table
});

export default OrderDetail;