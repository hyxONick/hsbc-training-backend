require('dotenv').config();
const { sequelize, User, Portfolio, PortfolioItem, Asset, ProfitLog } = require('../models');

async function syncDatabase() {
  try {
    console.log('开始同步数据库...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功！');
    
    // 同步所有模型到数据库
    // force: false 表示不会删除已存在的表
    // alter: true 表示如果表结构有变化会自动更新
    await sequelize.sync({ alter: true });
    
    console.log('数据库同步完成！');
    console.log('已创建的表:');
    console.log('- users (用户表)');
    console.log('- portfolios (投资组合表)');
    console.log('- portfolio_items (投资资产表)');
    console.log('- assets (公共资产信息表)');
    console.log('- profit_logs (收益记录表)');
    
  } catch (error) {
    console.error('数据库同步失败:', error);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 如果直接运行此脚本，则执行同步
if (require.main === module) {
  syncDatabase();
}

module.exports = syncDatabase;