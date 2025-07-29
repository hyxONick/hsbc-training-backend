const sequelize = require('../config/database');
const AssetInfo = require('../models/AssetInfo');
const Portfolio = require('../models/Portfolio');
const ProfitLog = require('../models/ProfitLog');
const PortfolioItem = require('../models/PortfolioItem');

const NUM_ASSETS = 20;
const NUM_PORTFOLIOS = 5;
const DAYS = 120;

const assetNames = [
  { code: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { code: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { code: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { code: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { code: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { code: 'US10Y', name: 'US Treasury Bond 10Y', type: 'bond' },
  { code: 'US30Y', name: 'US Treasury Bond 30Y', type: 'bond' },
  { code: 'JP10Y', name: 'Japan Gov Bond 10Y', type: 'bond' },
  { code: 'EUR5Y', name: 'EU Bond 5Y', type: 'bond' },
  { code: 'META', name: 'Meta Platforms Inc.', type: 'stock' },
  { code: 'NFLX', name: 'Netflix Inc.', type: 'stock' },
  { code: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
  { code: 'ORCL', name: 'Oracle Corporation', type: 'stock' },
  { code: 'BABA', name: 'Alibaba Group', type: 'stock' },
  { code: 'INTC', name: 'Intel Corporation', type: 'stock' },
  { code: 'T', name: 'AT&T Inc.', type: 'stock' },
  { code: 'BA', name: 'Boeing Co.', type: 'stock' },
  { code: 'KO', name: 'Coca-Cola Co.', type: 'stock' },
  { code: 'DIS', name: 'The Walt Disney Company', type: 'stock' },
  { code: 'GE', name: 'General Electric', type: 'stock' },
];

const portfolioNames = [
  'Retirement Fund',
  'Tech Focus Growth',
  'Dividend Strategy',
  'Emerging Markets',
  'Green Energy Picks'
];

function generateDateArray(startDate, days) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function generatePriceArray(days, base = 100, mean = 0.0005, stddev = 0.015) {
  const prices = [parseFloat(base.toFixed(2))];
  for (let i = 1; i < days; i++) {
    const u = Math.random();
    const v = Math.random();
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const dailyReturn = mean + stddev * randStdNormal;
    const lastPrice = prices[i - 1];
    const newPrice = lastPrice * Math.exp(dailyReturn);
    prices.push(parseFloat(newPrice.toFixed(2)));
  }
  return prices;
}

function getRandomDateBetween(start, end) {
  const diff = end.getTime() - start.getTime();
  return new Date(start.getTime() + Math.random() * diff);
}

async function createData() {
  try {
    console.log('🧹 Clearing old data...');
    await ProfitLog.destroy({ where: {} });
    await PortfolioItem.destroy({ where: {} });
    await Portfolio.destroy({ where: {} });
    await AssetInfo.destroy({ where: {} });

    const startDate = new Date('2025-04-03'); // 👈 起始
    const endDate = new Date('2025-07-31');   // 👈 截止
    const dateArr = generateDateArray(startDate, DAYS);

    console.log('📦 Creating AssetInfo...');
    const createdAssets = [];
    for (let i = 0; i < NUM_ASSETS; i++) {
      const assetInfo = assetNames[i];
      const asset = await AssetInfo.create({
        assetCode: assetInfo.code,
        name: assetInfo.name,
        assetType: assetInfo.type,
        price: (100 + i * 1.35).toFixed(2),
        currency: 'USD',
        updatedAt: new Date(),
        historyPriceArr: generatePriceArray(DAYS, 100 + i * 1.35),
        dateArr: dateArr,
        isDeleted: false
      });
      createdAssets.push(asset);
    }

    console.log('📁 Creating Portfolios...');
    for (let i = 0; i < NUM_PORTFOLIOS; i++) {
      const portfolio = await Portfolio.create({
        userId: 1,
        name: portfolioNames[i],
        isDeleted: false
      });

      console.log(`📊 Creating ProfitLogs for "${portfolio.name}"...`);
      for (let d = 0; d < DAYS; d++) {
        await ProfitLog.create({
          itemId: portfolio.id,
          date: dateArr[d],
          value: (10000 + Math.random() * 5000).toFixed(2),
          profit: (Math.random() * 100).toFixed(2),
          isDeleted: false
        });
      }

      console.log(`📌 Creating PortfolioItems for "${portfolio.name}"...`);
      const assetSubset = createdAssets.sort(() => 0.5 - Math.random()).slice(0, 6);
      for (const asset of assetSubset) {
        const isBuy = Math.random() > 0.3;
        const purchaseDate = getRandomDateBetween(startDate, endDate);
        const sellDate = !isBuy ? getRandomDateBetween(purchaseDate, endDate) : null;

        await PortfolioItem.create({
          portfolioId: portfolio.id,
          assetCode: asset.assetCode,
          assetType: asset.assetType,
          amount: (Math.random() * 5000 + 1000).toFixed(2),
          quantity: (Math.random() * 100 + 10).toFixed(4),
          type: isBuy ? 'buy' : 'sell',
          purchaseDate,
          sellDate,
          isDeleted: false
        });
      }
    }

    console.log('✅ Historical data (before 2025-08-01) created successfully.');
    process.exit();
  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
    process.exit(1);
  }
}

createData();
