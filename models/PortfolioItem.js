const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PortfolioItem = sequelize.define('PortfolioItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  portfolioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'portfolios',
      key: 'id'
    }
  },
  assetCode: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '资产代码（如AAPL、BND等）'
  },
  assetType: {
    type: DataTypes.ENUM('stock', 'bond', 'cash'),
    allowNull: false,
    comment: '资产类型'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: '投入金额/持有金额'
  },
  quantity: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    comment: '持仓数量（如股票数量）'
  },
  type: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false,
    comment: '买入/卖出'
  },
  sellDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '卖出日期（可以是空）'
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '买入日期'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'portfolio_items',
  timestamps: true,
});

module.exports = PortfolioItem;