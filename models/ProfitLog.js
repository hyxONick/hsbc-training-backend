const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProfitLog = sequelize.define('ProfitLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'portfolio_items',
      key: 'id'
    },
    comment: '对应 portfolio_item ID'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '日期'
  },
  value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: '当日资产市值'
  },
  profit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: '当日收益（或亏损）'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'profit_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['itemId', 'date'],
      unique: true,
      name: 'unique_item_date'
    }
  ]
});

module.exports = ProfitLog;