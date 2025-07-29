const Router = require('koa-router');
const { Op } = require('sequelize');
const AssetInfo = require('../models/AssetInfo');
const Portfolio = require('../models/Portfolio');
const PortfolioItem = require('../models/PortfolioItem');
const ProfitLog = require('../models/ProfitLog');

const dayjs = require('dayjs');

const router = new Router({ prefix: '/api/statistics' });

/**
 * 1️⃣ 获取前 N 个涨幅最高的股票/债券
 * GET /api/statistics/assets/top?limit=5
 */
router.get('/assets/top', async (ctx) => {
  const limit = parseInt(ctx.query.limit) || 5;

  // 取出所有资产（股票+债券）
  const assets = await AssetInfo.findAll({ where: { isDeleted: false } });

  // 计算涨幅（最后一天价格/第一天价格 - 1）
  const stockList = [];
  const bondList = [];

  assets.forEach(asset => {
    const prices = asset.historyPriceArr || [];
    if (prices.length < 2) return;

    const growth = (prices[prices.length - 1] / prices[0]) - 1;
    const record = {
      assetCode: asset.assetCode,
      name: asset.name,
      growth: parseFloat(growth.toFixed(4))
    };

    if (asset.assetType === 'stock') {
      stockList.push(record);
    } else if (asset.assetType === 'bond') {
      bondList.push(record);
    }
  });

  // 排序取前 N 名
  stockList.sort((a, b) => b.growth - a.growth);
  bondList.sort((a, b) => b.growth - a.growth);

  ctx.body = {
    topStocks: stockList.slice(0, limit),
    topBonds: bondList.slice(0, limit)
  };
});


/**
 * 2️⃣ 用户净值统计（当前/当月/昨日 + 投入总金额）
 * GET /api/statistics/users/:userId/summary
 */
router.get('/users/:userId/summary', async (ctx) => {
  const { userId } = ctx.params;

  // 找到用户的所有 Portfolio
  const portfolios = await Portfolio.findAll({
    where: { userId, isDeleted: false }
  });

  if (!portfolios.length) {
    ctx.body = { message: 'No portfolios found for this user.' };
    return;
  }

  const portfolioIds = portfolios.map(p => p.id);

  // 找 PortfolioItem 计算投入金额
  const items = await PortfolioItem.findAll({
    where: { portfolioId: { [Op.in]: portfolioIds }, isDeleted: false }
  });

  const totalInvestment = items.reduce((sum, item) => {
    const amt = parseFloat(item.amount);
    return item.type === 'buy' ? sum + amt : sum - amt;
  }, 0);

  // 🔍 获取 ProfitLog 计算净值
  const logs = await ProfitLog.findAll({
    where: { itemId: { [Op.in]: portfolioIds }, isDeleted: false }
  });

  // 最新日期
  const latestDate = logs.reduce((max, log) => log.date > max ? log.date : max, '');
  const yesterday = dayjs(latestDate).subtract(1, 'day').format('YYYY-MM-DD');
  const monthStart = dayjs(latestDate).startOf('month').format('YYYY-MM-DD');

  let currentStock = 0, currentBond = 0, currentCash = 0;
  let yesterdayStock = 0, yesterdayBond = 0, yesterdayCash = 0;
  let monthStock = 0, monthBond = 0, monthCash = 0;

  // 遍历计算分类净值
  for (const log of logs) {
    const portfolio = portfolios.find(p => p.id === log.itemId);
    if (!portfolio) continue;

    // 这里可以扩展 Portfolio 的类型 (目前全算成 stock/bond/cash)
    // 暂时直接分类，假设 portfolio 名字里有类型提示
    if (log.date === latestDate) {
      currentStock += parseFloat(log.value);
    }
    if (log.date === yesterday) {
      yesterdayStock += parseFloat(log.value);
    }
    if (log.date >= monthStart) {
      monthStock += parseFloat(log.value);
    }
  }

  ctx.body = {
    current: { stock: currentStock, bond: currentBond, cash: currentCash },
    monthly: { stock: monthStock, bond: monthBond, cash: monthCash },
    yesterday: { stock: yesterdayStock, bond: yesterdayBond, cash: yesterdayCash },
    totalInvestment
  };
});


/**
 * 3️⃣ 用户近 N 个月月度收益（股票/债券/现金）
 * GET /api/statistics/users/:userId/monthly-profit?months=6
 */
router.get('/users/:userId/monthly-profit', async (ctx) => {
  const { userId } = ctx.params;
  const months = parseInt(ctx.query.months) || 6;

  const portfolios = await Portfolio.findAll({
    where: { userId, isDeleted: false }
  });

  if (!portfolios.length) {
    ctx.body = { message: 'No portfolios found for this user.' };
    return;
  }

  const portfolioIds = portfolios.map(p => p.id);

  const logs = await ProfitLog.findAll({
    where: { itemId: { [Op.in]: portfolioIds }, isDeleted: false }
  });

  // 生成近 N 个月的标签
  const monthLabels = [];
  for (let i = months - 1; i >= 0; i--) {
    monthLabels.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
  }

  // 初始化数据
  const stockProfit = monthLabels.map(m => ({ month: m, profit: 0 }));
  const bondProfit = monthLabels.map(m => ({ month: m, profit: 0 }));
  const cashProfit = monthLabels.map(m => ({ month: m, profit: 0 }));

  // 计算每月最后一天净值
  const monthlyValue = {};
  logs.forEach(log => {
    const month = dayjs(log.date).format('YYYY-MM');
    if (!monthlyValue[month]) monthlyValue[month] = 0;
    monthlyValue[month] += parseFloat(log.value);
  });

  // 计算差值（当前月 - 上月）
  for (let i = 1; i < monthLabels.length; i++) {
    const currentMonth = monthLabels[i];
    const prevMonth = monthLabels[i - 1];

    const diff = (monthlyValue[currentMonth] || 0) - (monthlyValue[prevMonth] || 0);
    stockProfit[i].profit = diff; // 这里假设全是股票，你可以根据 assetType 分 stock/bond/cash
  }

  ctx.body = {
    stockProfit6M: stockProfit,
    bondProfit6M: bondProfit,
    cashProfit6M: cashProfit
  };
});

module.exports = router;
