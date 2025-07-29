const User = require('./User');
const Portfolio = require('./Portfolio');
const Asset = require('./Asset');
const PortfolioItem = require('./PortfolioItem');
const ProfitLog = require('./ProfitLog');

// User and Portfolio relationship
User.hasMany(Portfolio, {
  foreignKey: 'userId',
  as: 'portfolios'
});

Portfolio.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Portfolio and PortfolioItem relationship
Portfolio.hasMany(PortfolioItem, {
  foreignKey: 'portfolioId',
  as: 'items'
});

PortfolioItem.belongsTo(Portfolio, {
  foreignKey: 'portfolioId',
  as: 'portfolio'
});

// Asset and PortfolioItem relationship
Asset.hasMany(PortfolioItem, {
  foreignKey: 'assetCode',
  sourceKey: 'assetCode',
  as: 'portfolioItems'
});

PortfolioItem.belongsTo(Asset, {
  foreignKey: 'assetCode',
  targetKey: 'assetCode',
  as: 'asset'
});

// PortfolioItem and ProfitLog relationship
PortfolioItem.hasMany(ProfitLog, {
  foreignKey: 'itemId',
  as: 'profitLogs'
});

ProfitLog.belongsTo(PortfolioItem, {
  foreignKey: 'itemId',
  as: 'portfolioItem'
});

module.exports = {
  User,
  Portfolio,
  Asset,
  PortfolioItem,
  ProfitLog
};