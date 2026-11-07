import { DataTypes } from 'sequelize';
import sequelize from  '../config/database.js';


const Concert = sequelize.define('Concert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  venue: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  banner_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'cancelled'),
    allowNull: true,
    defaultValue: 'draft'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'concert',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false  // your SQL has no updated_at on this table
});

export default Concert