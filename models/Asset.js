const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assetCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  assetType: {
    type: DataTypes.ENUM('stock', 'bond', 'cash'),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  historyPriceArr: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '历史价格数组'
  },
  dateArr: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '历史时间粒度数组'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
  tableName: 'Assets'
});

module.exports = Asset;