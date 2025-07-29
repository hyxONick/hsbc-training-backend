const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Porfitoilo = sequelize.define('ProfitLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  itemId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATE },
  value: { type: DataTypes.DECIMAL(18, 2) },
  profit: { type: DataTypes.DECIMAL(18, 2) },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'profit_log',
  timestamps: false
});

module.exports = Porfitoilo;
