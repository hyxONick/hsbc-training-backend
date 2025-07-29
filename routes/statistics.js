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
      price: asset.price,
      growth: parseFloat(growth.toFixed(4)) * 100
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

  // 1️⃣ 找到用户所有 Portfolio
  const portfolios = await Portfolio.findAll({
    where: { userId, isDeleted: false }
  });
  if (!portfolios.length) {
    ctx.body = { message: 'No portfolios found for this user.' };
    return;
  }

  // 2️⃣ 找 PortfolioItem
  const portfolioIds = portfolios.map(p => p.id);
  const items = await PortfolioItem.findAll({
    where: { portfolioId: { [Op.in]: portfolioIds }, isDeleted: false }
  });
  if (!items.length) {
    ctx.body = { message: 'No portfolio items found for this user.' };
    return;
  }

  // ✅ 用 PortfolioItem.id 查 ProfitLog
  const itemIds = items.map(i => i.id);
  const logs = await ProfitLog.findAll({
    where: { itemId: { [Op.in]: itemIds }, isDeleted: false }
  });
  if (!logs.length) {
    ctx.body = { message: 'No profit logs found for this user.' };
    return;
  }

  // 3️⃣ 计算最新日期
  const latestDateRaw = new Date(Math.max(...logs.map(l => new Date(l.date))));
  const latestDate = dayjs(latestDateRaw);
  const yesterday = latestDate.subtract(1, 'day');
  const monthStart = latestDate.startOf('month');

  // 4️⃣ 统计值
  let current = { stock: 0, bond: 0, cash: 0 };
  let yesterdayVal = { stock: 0, bond: 0, cash: 0 };
  let monthVal = { stock: 0, bond: 0, cash: 0 };

  for (const log of logs) {
    const logDate = dayjs(log.date);
    const value = parseFloat(log.value);

    // 找 PortfolioItem 的类型
    const item = items.find(i => i.id === log.itemId);
    if (!item) continue;
    const type = item.assetType; // stock / bond / cash

    if (logDate.isSame(latestDate, 'day')) {
      current[type] += value;
    }
    if (logDate.isSame(yesterday, 'day')) {
      yesterdayVal[type] += value;
    }
    if (logDate.isAfter(monthStart) || logDate.isSame(monthStart, 'day')) {
      monthVal[type] += value;
    }
  }

  // 5️⃣ 投入金额
  const totalInvestment = items.reduce((sum, item) => {
    return item.type === 'buy'
      ? sum + parseFloat(item.amount)
      : sum - parseFloat(item.amount);
  }, 0);

  ctx.body = {
    current,
    monthly: monthVal,
    yesterday: yesterdayVal,
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

  // 1️⃣ 获取用户 Portfolio
  const portfolios = await Portfolio.findAll({
    where: { userId, isDeleted: false }
  });
  if (!portfolios.length) {
    ctx.body = { message: 'No portfolios found for this user.' };
    return;
  }

  // 2️⃣ 获取 PortfolioItem
  const portfolioIds = portfolios.map(p => p.id);
  const items = await PortfolioItem.findAll({
    where: { portfolioId: { [Op.in]: portfolioIds }, isDeleted: false }
  });
  if (!items.length) {
    ctx.body = { message: 'No portfolio items found for this user.' };
    return;
  }

  // 3️⃣ 用 PortfolioItem.id 查 ProfitLog
  const itemIds = items.map(i => i.id);
  const logs = await ProfitLog.findAll({
    where: { itemId: { [Op.in]: itemIds }, isDeleted: false }
  });
  if (!logs.length) {
    ctx.body = { message: 'No profit logs found for this user.' };
    return;
  }

  // 4️⃣ 生成最近 N 个月的标签
  const monthLabels = [];
  for (let i = months - 1; i >= 0; i--) {
    monthLabels.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
  }

  // 初始化结果结构
  const stockProfit = monthLabels.map(m => ({ month: m, profit: 0 }));
  const bondProfit = monthLabels.map(m => ({ month: m, profit: 0 }));
  const cashProfit = monthLabels.map(m => ({ month: m, profit: 0 }));

  // 5️⃣ 先统计每个月各类型的“月末净值”
  const monthlyValue = {
    stock: {},
    bond: {},
    cash: {}
  };

  for (const log of logs) {
    const month = dayjs(log.date).format('YYYY-MM');
    const item = items.find(i => i.id === log.itemId);
    if (!item) continue;
    const type = item.assetType; // stock / bond / cash

    // ✅ 我们只保留 **当月最后一天** 的值（净值）
    if (!monthlyValue[type][month] || new Date(log.date) > new Date(monthlyValue[type][month].date)) {
      monthlyValue[type][month] = { date: log.date, value: parseFloat(log.value) };
    }
  }

  // 6️⃣ 计算每个月的利润（本月净值 - 上个月净值）
  for (let i = 1; i < monthLabels.length; i++) {
    const currentMonth = monthLabels[i];
    const prevMonth = monthLabels[i - 1];

    // stock
    const stockNow = monthlyValue.stock[currentMonth]?.value || 0;
    const stockPrev = monthlyValue.stock[prevMonth]?.value || 0;
    stockProfit[i].profit = stockNow - stockPrev;

    // bond
    const bondNow = monthlyValue.bond[currentMonth]?.value || 0;
    const bondPrev = monthlyValue.bond[prevMonth]?.value || 0;
    bondProfit[i].profit = bondNow - bondPrev;

    // cash
    const cashNow = monthlyValue.cash[currentMonth]?.value || 0;
    const cashPrev = monthlyValue.cash[prevMonth]?.value || 0;
    cashProfit[i].profit = cashNow - cashPrev;
  }

  // 7️⃣ 返回结果
  ctx.body = {
    stockProfit6M: stockProfit,
    bondProfit6M: bondProfit,
    cashProfit6M: cashProfit
  };
});


module.exports = router;
