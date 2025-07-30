const Router = require('koa-router');
const AssetInfo = require('../models/AssetInfo');
const Portfolio = require('../models/Portfolio');
const PortfolioItem = require('../models/PortfolioItem');
const { Op } = require('sequelize');
const { requireAuth } = require('../middleware/auth');

const router = new Router({ prefix: '/api/portfolios' });

/**
 * @swagger
 * tags:
 *   name: Portfolios
 *   description: 投资组合管理接口
 */

/**
 * @swagger
 * /api/portfolios:
 *   get:
 *     summary: 获取所有未删除的投资组合（含资产）
 *     tags: [Portfolios]
 *     responses:
 *       200:
 *         description: 成功返回投资组合数组
 */
router.get('/', async (ctx) => {
  const portfolios = await Portfolio.findAll({
    where: { isDeleted: false },
    include: [{
      model: PortfolioItem,
      where: { isDeleted: false },
      required: false
    }]
  });
  ctx.body = portfolios;
});

/**
 * @swagger
 * /api/portfolios/{id}:
 *   get:
 *     summary: 根据 ID 获取投资组合（含资产）
 *     tags: [Portfolios]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 投资组合ID
 *     responses:
 *       200:
 *         description: 成功返回投资组合
 *       404:
 *         description: 未找到投资组合
 */
router.get('/:id', async (ctx) => {
  const portfolio = await Portfolio.findByPk(ctx.params.id, {
    include: [{
      model: PortfolioItem,
      where: { isDeleted: false },
      required: false
    }]
  });
  if (!portfolio) ctx.throw(404, 'Portfolio not found');
  ctx.body = portfolio;
});

/**
 * @swagger
 * /api/portfolios/user/{userId}:
 *   get:
 *     summary: 根据用户ID获取该用户所有投资组合
 *     tags: [Portfolios]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 返回用户的投资组合列表
 */
router.get('/user/:userId', async (ctx) => {
  const portfolios = await Portfolio.findAll({
    where: { userId: ctx.params.userId, isDeleted: false },
    include: [{
      model: PortfolioItem,
      where: { isDeleted: false },
      required: false
    }],
    order: [['createdAt', 'DESC']]
  });
  ctx.body = portfolios;
});

/**
 * @swagger
 * /api/portfolios/create:
 *   post:
 *     summary: 创建投资组合（需登录）
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: 我的退休投资组合
 *     responses:
 *       200:
 *         description: 成功返回创建的投资组合
 */
router.post('/create', requireAuth, async (ctx) => {
  const newPortfolio = await Portfolio.create(ctx.request.body);
  ctx.body = newPortfolio;
});

/**
 * @swagger
 * /api/portfolios/update/{id}:
 *   post:
 *     summary: 修改投资组合（需登录）
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 投资组合ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               name: "更新后的投资组合名称"
 *     responses:
 *       200:
 *         description: 返回更新后的投资组合
 *       404:
 *         description: 未找到投资组合
 */
router.post('/update/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await Portfolio.update(ctx.request.body, {
    where: { id: ctx.params.id }
  });

  if (updatedRowsCount === 0) ctx.throw(404, 'Portfolio not found');

  const updatedPortfolio = await Portfolio.findByPk(ctx.params.id, {
    include: [{
      model: PortfolioItem,
      where: { isDeleted: false },
      required: false
    }]
  });
  ctx.body = updatedPortfolio;
});

/**
 * @swagger
 * /api/portfolios/delete/{id}:
 *   post:
 *     summary: 逻辑删除投资组合（需登录）
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 投资组合ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 未找到投资组合
 */
router.post('/delete/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await Portfolio.update(
    { isDeleted: true },
    { where: { id: ctx.params.id } }
  );

  if (updatedRowsCount === 0) ctx.throw(404, 'Portfolio not found');

  const deletedPortfolio = await Portfolio.findByPk(ctx.params.id);
  ctx.body = {
    message: 'Portfolio logically deleted',
    portfolio: deletedPortfolio
  };
});

/**
 * @swagger
 * /api/portfolios/search:
 *   get:
 *     summary: 分页 + 条件搜索投资组合
 *     tags: [Portfolios]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer }
 *         description: 页码
 *       - name: pageSize
 *         in: query
 *         schema: { type: integer }
 *         description: 每页数量
 *       - name: userId
 *         in: query
 *         schema: { type: integer }
 *         description: 按用户ID筛选
 *       - name: name
 *         in: query
 *         schema: { type: string }
 *         description: 模糊搜索组合名称
 *     responses:
 *       200:
 *         description: 返回分页后的投资组合列表
 */
router.get('/search', async (ctx) => {
  const { page = 1, pageSize = 10, userId, name } = ctx.query;

  const filter = { isDeleted: false };
  if (userId) filter.userId = userId;
  if (name) filter.name = { [Op.like]: `%${name}%` };

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const limit = parseInt(pageSize);

  const { rows: items, count: total } = await Portfolio.findAndCountAll({
    where: filter,
    include: [{
      model: PortfolioItem,
      where: { isDeleted: false },
      required: false
    }],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  ctx.body = { total, page: parseInt(page), pageSize: parseInt(pageSize), items };
});

/**
 * @swagger
 * /api/portfolios/{id}/stats:
 *   get:
 *     summary: 获取投资组合统计信息（资产数量、买卖统计）
 *     tags: [Portfolios]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *         description: 投资组合ID
 *     responses:
 *       200:
 *         description: 返回统计信息（totalItems, totalAmount, buyCount, sellCount, assetTypes）
 *       404:
 *         description: 未找到投资组合
 */
router.get('/:id/stats', async (ctx) => {
  const portfolioId = ctx.params.id;
  
  const portfolio = await Portfolio.findByPk(portfolioId);
  if (!portfolio) ctx.throw(404, 'Portfolio not found');

  const items = await PortfolioItem.findAll({
    where: { portfolioId, isDeleted: false }
  });

  const stats = {
    totalItems: items.length,
    totalAmount: items.reduce((sum, item) => sum + parseFloat(item.amount), 0),
    assetTypes: {},
    buyCount: items.filter(item => item.type === 'buy').length,
    sellCount: items.filter(item => item.type === 'sell').length
  };

  items.forEach(item => {
    if (stats.assetTypes[item.assetType]) {
      stats.assetTypes[item.assetType]++;
    } else {
      stats.assetTypes[item.assetType] = 1;
    }
  });

  ctx.body = { portfolio, stats };
});

/**
 * @swagger
 * /api/portfolios/{id}/summary:
 *   get:
 *     summary: 获取投资组合的收益汇总（已实现、未实现、总收益、持仓详情）
 *     tags: [Portfolios]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 投资组合ID
 *     responses:
 *       200:
 *         description: 返回投资组合收益汇总
 */
router.get('/:id/summary', async (ctx) => {
  const portfolioId = ctx.params.id;

  // 1️⃣ 查 Portfolio
  const portfolio = await Portfolio.findByPk(portfolioId);
  if (!portfolio) ctx.throw(404, 'Portfolio not found');

  // 2️⃣ 查 PortfolioItem
  const items = await PortfolioItem.findAll({
    where: { portfolioId, isDeleted: false }
  });

  // 3️⃣ 查 AssetInfo
  const assetCodes = [...new Set(items.map(item => item.assetCode))];
  const assetInfos = await AssetInfo.findAll({
    where: { assetCode: assetCodes, isDeleted: false }
  });

  const assetMap = Object.fromEntries(assetInfos.map(a => [a.assetCode, a]));

  // 4️⃣ 计算收益和持仓
  const holdings = {};
  let realizedGain = 0;
  let unrealizedGain = 0;
  let totalValue = 0;

  items.forEach(item => {
    const asset = assetMap[item.assetCode];
    if (!asset) return;

    const currentPrice = parseFloat(asset.price);
    const tradeQty = parseFloat(item.quantity);
    const tradeAmount = parseFloat(item.amount);
    const tradePrice = tradeAmount / tradeQty;

    // 初始化
    if (!holdings[item.assetCode]) {
      holdings[item.assetCode] = {
        assetCode: item.assetCode,
        name: asset.name,
        assetType: item.assetType,
        quantity: 0,
        cost: 0,
        avgCost: 0,
        currentPrice,
        marketValue: 0,
        unrealizedGain: 0,
        status: 'closed'  // 默认 closed，后面会修正
      };
    }

    const h = holdings[item.assetCode];

    if (item.type === 'buy') {
      h.quantity += tradeQty;
      h.cost += tradeAmount;
    } else if (item.type === 'sell') {
      const avgCost = h.quantity > 0 ? h.cost / h.quantity : tradePrice;
      realizedGain += (tradePrice - avgCost) * tradeQty;

      h.quantity -= tradeQty;
      h.cost -= avgCost * tradeQty;
    }
  });

  // 5️⃣ 计算持仓价值 & 状态
  for (const code in holdings) {
    const h = holdings[code];

    if (h.quantity > 0) {
      // ✅ 多头
      h.status = 'long';
      h.avgCost = h.cost / h.quantity;
      h.marketValue = h.quantity * h.currentPrice;
      h.unrealizedGain = (h.currentPrice - h.avgCost) * h.quantity;

      totalValue += h.marketValue;
      unrealizedGain += h.unrealizedGain;

    } else if (h.quantity < 0) {
      // ✅ 空头
      h.status = 'short';
      h.avgCost = h.cost / h.quantity;
      h.marketValue = h.quantity * h.currentPrice; // 负值
      h.unrealizedGain = (h.avgCost - h.currentPrice) * Math.abs(h.quantity);

      totalValue += h.marketValue;
      unrealizedGain += h.unrealizedGain;

    } else {
      // ✅ 已清仓
      h.status = 'closed';
      h.avgCost = 0;
      h.marketValue = 0;
      h.unrealizedGain = 0;
    }
  }

  const totalGain = realizedGain + unrealizedGain;

  // ✅ 成本只算 long 和 short 的（不算 closed）
  const totalCost = Object.values(holdings)
    .filter(h => h.quantity !== 0)
    .reduce((sum, h) => sum + Math.abs(h.cost), 0);

  const totalGainPercent = totalCost > 0
    ? ((totalGain / totalCost) * 100).toFixed(2)
    : "0.00";

  // ✅ assetCount 只统计 quantity ≠ 0 的资产
  const assetCount = Object.values(holdings).filter(h => h.quantity > 0).length;

  ctx.body = {
    portfolioId,
    totalValue,
    realizedGain,
    unrealizedGain,
    totalGain,
    totalGainPercent,
    assetCount,
    holdings: Object.values(holdings)
  };
});

/**
 * ===========================
 * 1️⃣ 获取指定用户所有组合的收益时间序列
 * ===========================
 */
/**
 * @swagger
 * /api/portfolios/{userId}/returns:
 *   get:
 *     summary: 获取指定用户所有投资组合的收益时间序列
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户 ID
 *     responses:
 *       200:
 *         description: 返回每个组合名称对应的时间序列净值数组
 */
router.get('/:userId/returns', async (ctx) => {
  const { userId } = ctx.params;

  // ✅ Portfolio → PortfolioItem → AssetInfo (一次性 JOIN)
  const portfolios = await Portfolio.findAll({
    where: { isDeleted: false, userId },
    include: [
      {
        model: PortfolioItem,
        where: { isDeleted: false, type: 'buy' },
        required: false,
        include: [
          {
            model: AssetInfo,
            where: { isDeleted: false },
            required: false
          }
        ]
      }
    ]
  });

  if (!portfolios.length) {
    ctx.body = {};
    return;
  }

  // ✅ 找出最长 dateArr 统一时间点
  let maxDateArr = [];
  portfolios.forEach(p => {
    p.PortfolioItems.forEach(item => {
      if (item.AssetInfo && item.AssetInfo.dateArr?.length > maxDateArr.length) {
        maxDateArr = item.AssetInfo.dateArr;
      }
    });
  });

  // ✅ 计算每个组合每天的净值
  const result = {};
  portfolios.forEach(p => {
    const values = maxDateArr.map((time, idx) => {
      let totalValue = 0;
      p.PortfolioItems.forEach(item => {
        if (!item.AssetInfo) return;
        const price = item.AssetInfo.historyPriceArr?.[idx] || 0;
        totalValue += price * parseFloat(item.quantity || 0);
      });
      return { time, value: parseFloat(totalValue.toFixed(2)) };
    });
    result[p.name] = values;
  });

  ctx.body = result;
});


/**
 * ===========================
 * 2️⃣ 获取指定用户的资产收益率
 * ===========================
 */
/**
 * @swagger
 * /api/portfolios/{userId}/asset-returns:
 *   get:
 *     summary: 获取指定用户涉及的资产收益率
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户 ID
 *     responses:
 *       200:
 *         description: 返回用户持仓涉及的资产收益率数组
 */
router.get('/:userId/asset-returns', async (ctx) => {
  const { userId } = ctx.params;

  // ✅ Portfolio → PortfolioItem → AssetInfo
  const portfolios = await Portfolio.findAll({
    where: { isDeleted: false, userId },
    include: [
      {
        model: PortfolioItem,
        where: { isDeleted: false },
        required: false,
        include: [
          {
            model: AssetInfo,
            where: { isDeleted: false },
            required: false
          }
        ]
      }
    ]
  });

  if (!portfolios.length) {
    ctx.body = [];
    return;
  }

  // ✅ 把所有 AssetInfo 收集起来计算收益率
  const assetsSeen = new Map();

  portfolios.forEach(p => {
    p.PortfolioItems.forEach(item => {
      const asset = item.AssetInfo;
      if (asset && !assetsSeen.has(asset.assetCode)) {
        assetsSeen.set(asset.assetCode, asset);
      }
    });
  });

  const result = [];
  assetsSeen.forEach(asset => {
    const prices = asset.historyPriceArr || [];
    if (prices.length < 2) return;
    const first = prices[0];
    const last = prices[prices.length - 1];
    const ret = first === 0 ? 0 : ((last - first) / first) * 100;

    result.push({
      name: asset.assetCode,
      return: parseFloat(ret.toFixed(2)),
      type: asset.assetType
    });
  });

  ctx.body = result;
});


/**
 * ===========================
 * 3️⃣ 获取指定用户的所有交易记录
 * ===========================
 */
/**
 * @swagger
 * /api/portfolios/{userId}/trade-records:
 *   get:
 *     summary: 获取指定用户的所有买卖交易记录
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户 ID
 *     responses:
 *       200:
 *         description: 返回该用户的所有交易记录（买卖动作、价格、日期等）
 */
router.get('/:userId/trade-records', async (ctx) => {
  const { userId } = ctx.params;

  // ✅ Portfolio → PortfolioItem → AssetInfo
  const portfolios = await Portfolio.findAll({
    where: { isDeleted: false, userId },
    include: [
      {
        model: PortfolioItem,
        where: { isDeleted: false },
        required: false,
        include: [
          {
            model: AssetInfo,
            where: { isDeleted: false },
            required: false
          }
        ]
      }
    ]
  });

  if (!portfolios.length) {
    ctx.body = [];
    return;
  }

  const records = [];

  portfolios.forEach(p => {
    p.PortfolioItems.forEach(item => {
      const asset = item.AssetInfo;
      if (!asset) return; // 资产不存在直接跳过

      // ✅ 计算买入价（买入金额 ÷ 数量）
      const buyPrice = parseFloat(item.amount) / parseFloat(item.quantity);
      let profit = 0;

      if (item.type === 'buy') {
        // ✅ 买入后未卖出 → 计算浮动盈亏（当前价 - 买入价）* 数量
        const currentPrice = parseFloat(asset.price);
        profit = (currentPrice - buyPrice) * parseFloat(item.quantity);

      } else if (item.type === 'sell') {
        // ✅ 卖出 → 计算实现盈亏（卖出价 - 买入价）* 数量
        // 这里卖出价同样是 amount ÷ quantity（即卖出单价）
        const sellPrice = buyPrice; // 注意：如果你数据库里 `amount` 是卖出金额，就能直接复用
        const priceOnBuyDay = parseFloat(asset.historyPriceArr?.[0]) || buyPrice; 
        const priceOnSellDay = parseFloat(asset.price);
        
        // ✅ 用交易日的价格差计算利润（假设卖出时资产现价就是卖出价）
        profit = (priceOnSellDay - priceOnBuyDay) * parseFloat(item.quantity);
      }

      records.push({
        portfolio: p.name,
        assetType: item.assetType,
        action: item.type,
        price: buyPrice.toFixed(2),
        profit: parseFloat(profit.toFixed(2)),
        date: item.purchaseDate ? item.purchaseDate.toISOString().slice(0, 10) : null
      });
    });
  });

  ctx.body = records;
});

module.exports = router;
