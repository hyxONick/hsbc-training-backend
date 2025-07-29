const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PortfolioItem = sequelize.define('PortfolioItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  portfolioId: { type: DataTypes.INTEGER, allowNull: false },
  assetCode: { type: DataTypes.STRING(20), allowNull: false },
  assetType: { type: DataTypes.ENUM('stock', 'bond', 'cash'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
  type: { type: DataTypes.ENUM('buy', 'sell'), allowNull: false },
  sellDate: { type: DataTypes.DATE, allowNull: true },
  purchaseDate: { type: DataTypes.DATE, allowNull: true },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'portfolio_item',
  timestamps: false
});

module.exports = PortfolioItem;
