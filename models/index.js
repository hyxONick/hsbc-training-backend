const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const Portfolio = require('./Portfolio');
const PortfolioItem = require('./PortfolioItem');
const Asset = require('./Asset');
const ProfitLog = require('./ProfitLog');

// Define associations
// User -> Portfolio (一对多)
User.hasMany(Portfolio, {
  foreignKey: 'userId',
  as: 'portfolios'
});
Portfolio.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Portfolio -> PortfolioItem (一对多)
Portfolio.hasMany(PortfolioItem, {
  foreignKey: 'portfolioId',
  as: 'items'
});
PortfolioItem.belongsTo(Portfolio, {
  foreignKey: 'portfolioId',
  as: 'portfolio'
});

// Asset -> PortfolioItem (一对多，通过assetCode关联)
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

// PortfolioItem -> ProfitLog (一对多)
PortfolioItem.hasMany(ProfitLog, {
  foreignKey: 'itemId',
  as: 'profitLogs'
});
ProfitLog.belongsTo(PortfolioItem, {
  foreignKey: 'itemId',
  as: 'portfolioItem'
});

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Portfolio,
  PortfolioItem,
  Asset,
  ProfitLog
};