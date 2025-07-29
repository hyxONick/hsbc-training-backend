const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assetCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: '资产代码'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '资产名称'
  },
  assetType: {
    type: DataTypes.ENUM('stock', 'bond'),
    allowNull: false,
    comment: '资产类型'
  },
  price: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    comment: '当前价格（每日更新）'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
    comment: '币种（如CNY,USD）'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '最新更新时间'
  },
  historyPriceArr: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '历史价格数组'
  },
  dateArr: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '历史时间粒度（天），对应历史价格'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'assets',
  timestamps: true,
});

module.exports = Asset;