import { DataTypes } from 'sequelize';
import Sequelize from 'sequelize';

const User = Sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'event_organizer', 'user'),
    defaultValue: 'user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default User