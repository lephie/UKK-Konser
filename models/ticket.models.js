import { DataTypes } from 'sequelize';
import Sequelize from 'sequelize';

const Ticket = Sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_detail_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  concert_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ticket_tier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  qr_code: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('used', 'unused', 'cancelled'),
    allowNull: true
  },
  check_in_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  check_out_by: {
    type: DataTypes.INTEGER,
    allowNull: false  // this is the gate staff user id
  }
}, {
  tableName: 'ticket',
  timestamps: false  // your SQL has no timestamps on this table
});

export default Ticket;