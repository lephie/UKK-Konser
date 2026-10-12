import { DataTypes } from 'sequelize';
import Sequelize from 'sequelize';

const TicketTier = Sequelize.define('TicketTier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  concert_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL,
    allowNull: true
  },
  quota: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sold: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  sale_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sale_end: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ticket_tier',
  timestamps: false  // your SQL has no created_at or updated_at on this table
});

export default TicketTier;