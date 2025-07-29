const Router = require('koa-router');
const { Op } = require('sequelize');
const AssetInfo = require('../models/AssetInfo');
const Portfolio = require('../models/Portfolio');
const PortfolioItem = require('../models/PortfolioItem');
const ProfitLog = require('../models/ProfitLog');

const dayjs = require('dayjs');

const router = new Router({ prefix: '/api/statistics' });

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: 数据分析与统计接口
 */

/**
 * @swagger
 * /api/statistics/assets/top:
 *   get:
 *     summary: 获取前 N 个涨幅最高的股票和债券
 *     tags: [Statistics]
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 5
 *         description: 返回前 N 名，默认为 5
 *     responses:
 *       200:
 *         description: 返回涨幅排名前 N 的股票和债券
 */
router.get('/assets/top', async (ctx) => {
  const limit = parseInt(ctx.query.limit) || 5;

  // 取出所有资产（股票+债券）
  const assets = await AssetInfo.findAll({ where: { isDeleted: false } });

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

  stockList.sort((a, b) => b.growth - a.growth);
  bondList.sort((a, b) => b.growth - a.growth);

  ctx.body = {
    topStocks: stockList.slice(0, limit),
    topBonds: bondList.slice(0, limit)
  };
});

/**
 * @swagger
 * /api/statistics/users/{userId}/summary:
 *   get:
 *     summary: 获取用户净值统计（当前/当月/昨日 + 投入总金额）
 *     tags: [Statistics]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 返回用户净值汇总信息
 */
router.get('/users/:userId/summary', async (ctx) => {
  const { userId } = ctx.params;

  const portfolios = await Portfolio.findAll({ where: { userId, isDeleted: false } });

  if (!portfolios.length) {
    ctx.body = { message: 'No portfolios found for this user.' };
    return;
  }

  const portfolioIds = portfolios.map(p => p.id);

  // 投入金额
  const items = await PortfolioItem.findAll({
    where: { portfolioId: { [Op.in]: portfolioIds }, isDeleted: false }
  });

  const totalInvestment = items.reduce((sum, item) => {
    const amt = parseFloat(item.amount);
    return item.type === 'buy' ? sum + amt : sum - amt;
  }, 0);

  // 获取 ProfitLog
  const logs = await ProfitLog.findAll({
    where: { itemId: { [Op.in]: portfolioIds }, isDeleted: false }
  });

  const latestDate = logs.reduce((max, log) => log.date > max ? log.date : max, '');
  const yesterday = dayjs(latestDate).subtract(1, 'day').format('YYYY-MM-DD');
  const monthStart = dayjs(latestDate).startOf('month').format('YYYY-MM-DD');

  let currentStock = 0, currentBond = 0, currentCash = 0;
  let yesterdayStock = 0, yesterdayBond = 0, yesterdayCash = 0;
  let monthStock = 0, monthBond = 0, monthCash = 0;

  for (const log of logs) {
    if (log.date === latestDate) currentStock += parseFloat(log.value);
    if (log.date === yesterday) yesterdayStock += parseFloat(log.value);
    if (log.date >= monthStart) monthStock += parseFloat(log.value);
  }

  ctx.body = {
    current: { stock: currentStock, bond: currentBond, cash: currentCash },
    monthly: { stock: monthStock, bond: monthBond, cash: monthCash },
    yesterday: { stock: yesterdayStock, bond: yesterdayBond, cash: yesterdayCash },
    totalInvestment
  };
});

/**
 * @swagger
 * /api/statistics/users/{userId}/monthly-profit:
 *   get:
 *     summary: 获取用户近 N 个月的月度收益（股票/债券/现金）
 *     tags: [Statistics]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: months
 *         in: query
 *         schema:
 *           type: integer
 *           default: 6
 *         description: 统计的月数（默认 6 个月）
 *     responses:
 *       200:
 *         description: 返回近 N 个月的收益统计
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

  const monthLabels = [];
  for (let i = months - 1; i >= 0; i--) {
    monthLabels.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
  }

  const stockProfit = monthLabels.map(m => ({ month: m, profit: 0 }));
  const bondProfit = monthLabels.map(m => ({ month: m, profit: 0 }));
  const cashProfit = monthLabels.map(m => ({ month: m, profit: 0 }));

  const monthlyValue = {};
  logs.forEach(log => {
    const month = dayjs(log.date).format('YYYY-MM');
    if (!monthlyValue[month]) monthlyValue[month] = 0;
    monthlyValue[month] += parseFloat(log.value);
  });

  for (let i = 1; i < monthLabels.length; i++) {
    const currentMonth = monthLabels[i];
    const prevMonth = monthLabels[i - 1];

    const diff = (monthlyValue[currentMonth] || 0) - (monthlyValue[prevMonth] || 0);
    stockProfit[i].profit = diff; // 暂时假设全是股票
  }

  ctx.body = {
    stockProfit6M: stockProfit,
    bondProfit6M: bondProfit,
    cashProfit6M: cashProfit
  };
});

module.exports = router;
