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
      model: 'Portfolios',
      key: 'id'
    }
  },
  assetCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'Assets',
      key: 'assetCode'
    }
  },
  assetType: {
    type: DataTypes.ENUM('stock', 'bond', 'cash'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    comment: '投入金额/持有金额'
  },
  quantity: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    comment: '持仓数量'
  },
  type: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false,
    comment: '买入/卖出类型'
  },
  sellDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '卖出日期'
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
  timestamps: true,
  tableName: 'PortfolioItems'
});

module.exports = PortfolioItem;