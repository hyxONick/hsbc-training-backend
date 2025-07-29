require('dotenv').config();
const { sequelize, User, Portfolio, PortfolioItem, Asset, ProfitLog } = require('../models');

async function seedSampleData() {
  try {
    console.log('开始添加示例数据...');
    
    // 创建示例资产
    const assets = await Asset.bulkCreate([
      {
        assetCode: 'AAPL',
        name: '苹果公司',
        assetType: 'stock',
        price: 150.25,
        currency: 'USD',
        historyPriceArr: [145.50, 148.30, 150.25],
        dateArr: ['2024-01-01', '2024-01-02', '2024-01-03']
      },
      {
        assetCode: 'GOOGL',
        name: '谷歌',
        assetType: 'stock',
        price: 2800.50,
        currency: 'USD',
        historyPriceArr: [2750.00, 2780.25, 2800.50],
        dateArr: ['2024-01-01', '2024-01-02', '2024-01-03']
      },
      {
        assetCode: 'BND',
        name: '先锋总债券市场ETF',
        assetType: 'bond',
        price: 82.15,
        currency: 'USD',
        historyPriceArr: [82.00, 82.08, 82.15],
        dateArr: ['2024-01-01', '2024-01-02', '2024-01-03']
      }
    ], { ignoreDuplicates: true });
    
    console.log('✓ 已添加示例资产数据');
    
    // 查找或创建示例用户
    const [user] = await User.findOrCreate({
      where: { username: 'demo_user' },
      defaults: {
        username: 'demo_user',
        password: '$2b$10$example.hash', // 示例密码哈希
        role: 'user'
      }
    });
    
    // 创建示例投资组合
    const [portfolio] = await Portfolio.findOrCreate({
      where: { 
        userId: user.id,
        name: '我的投资组合'
      },
      defaults: {
        userId: user.id,
        name: '我的投资组合',
        isDeleted: false
      }
    });
    
    console.log('✓ 已添加示例投资组合');
    
    // 创建示例投资项目
    const portfolioItems = await PortfolioItem.bulkCreate([
      {
        portfolioId: portfolio.id,
        assetCode: 'AAPL',
        assetType: 'stock',
        amount: 15025.00,
        quantity: 100,
        type: 'buy',
        purchaseDate: '2024-01-01',
        isDeleted: false
      },
      {
        portfolioId: portfolio.id,
        assetCode: 'GOOGL',
        assetType: 'stock',
        amount: 28005.00,
        quantity: 10,
        type: 'buy',
        purchaseDate: '2024-01-01',
        isDeleted: false
      },
      {
        portfolioId: portfolio.id,
        assetCode: 'BND',
        assetType: 'bond',
        amount: 8215.00,
        quantity: 100,
        type: 'buy',
        purchaseDate: '2024-01-01',
        isDeleted: false
      }
    ], { ignoreDuplicates: true });
    
    console.log('✓ 已添加示例投资项目');
    
    // 创建示例收益记录
    const profitLogs = [];
    portfolioItems.forEach((item, index) => {
      const dates = ['2024-01-01', '2024-01-02', '2024-01-03'];
      const profits = [
        [0, 275, 500],      // AAPL
        [0, 302.5, 605],    // GOOGL  
        [0, 8, 15]          // BND
      ];
      const values = [
        [15025, 15300, 15525],  // AAPL
        [28005, 28307.5, 28610], // GOOGL
        [8215, 8223, 8230]      // BND
      ];
      
      dates.forEach((date, dateIndex) => {
        profitLogs.push({
          itemId: item.id,
          date: date,
          value: values[index][dateIndex],
          profit: profits[index][dateIndex],
          isDeleted: false
        });
      });
    });
    
    await ProfitLog.bulkCreate(profitLogs, { ignoreDuplicates: true });
    
    console.log('✓ 已添加示例收益记录');
    console.log('示例数据添加完成！');
    
  } catch (error) {
    console.error('添加示例数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本，则执行数据填充
if (require.main === module) {
  seedSampleData();
}

module.exports = seedSampleData;