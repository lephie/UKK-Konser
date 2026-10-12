import { DataTypes } from 'sequelize';
import Sequelize from 'sequelize';

const Notification = Sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(70),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'notification',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false  // your SQL has no updated_at on this table
});

export default Notification;