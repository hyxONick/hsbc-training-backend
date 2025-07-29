const Router = require('koa-router');
const PortfolioItem = require('../models/PortfolioItem');
const Portfolio = require('../models/Portfolio');
const { Op } = require('sequelize');
const { requireAuth } = require('../middleware/auth');

const router = new Router({ prefix: '/api/portfolio-items' });

/**
 * @swagger
 * tags:
 *   name: PortfolioItems
 *   description: 投资组合项目管理接口
 */

/**
 * @swagger
 * /api/portfolio-items:
 *   get:
 *     summary: 获取所有未删除的投资组合项目（含组合信息）
 *     tags: [PortfolioItems]
 *     responses:
 *       200:
 *         description: 成功返回项目列表
 */
router.get('/', async (ctx) => {
  const items = await PortfolioItem.findAll({
    where: { isDeleted: false },
    include: [{
      model: Portfolio,
      where: { isDeleted: false },
      required: false
    }]
  });
  ctx.body = items;
});

/**
 * @swagger
 * /api/portfolio-items/{id}:
 *   get:
 *     summary: 根据 ID 获取投资组合项目（含组合信息）
 *     tags: [PortfolioItems]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 返回投资组合项目
 *       404:
 *         description: 未找到项目
 */
router.get('/:id', async (ctx) => {
  const item = await PortfolioItem.findByPk(ctx.params.id, {
    include: [{
      model: Portfolio,
      where: { isDeleted: false },
      required: false
    }]
  });
  if (!item) ctx.throw(404, 'Portfolio item not found');
  ctx.body = item;
});

/**
 * @swagger
 * /api/portfolio-items/portfolio/{portfolioId}:
 *   get:
 *     summary: 根据投资组合ID获取所有项目
 *     tags: [PortfolioItems]
 *     parameters:
 *       - name: portfolioId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 返回该投资组合的所有项目
 */
router.get('/portfolio/:portfolioId', async (ctx) => {
  const items = await PortfolioItem.findAll({
    where: { portfolioId: ctx.params.portfolioId, isDeleted: false },
    order: [['purchaseDate', 'DESC'], ['sellDate', 'DESC']]
  });
  ctx.body = items;
});

/**
 * @swagger
 * /api/portfolio-items/asset/{assetCode}:
 *   get:
 *     summary: 根据资产代码获取所有项目
 *     tags: [PortfolioItems]
 *     parameters:
 *       - name: assetCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 返回指定资产代码的所有项目
 */
router.get('/asset/:assetCode', async (ctx) => {
  const items = await PortfolioItem.findAll({
    where: { assetCode: ctx.params.assetCode, isDeleted: false },
    include: [{
      model: Portfolio,
      where: { isDeleted: false },
      required: false
    }],
    order: [['purchaseDate', 'DESC']]
  });
  ctx.body = items;
});

/**
 * @swagger
 * /api/portfolio-items/create:
 *   post:
 *     summary: 创建投资组合项目（需登录）
 *     tags: [PortfolioItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               portfolioId: { type: integer, example: 1 }
 *               assetCode: { type: string, example: "AAPL" }
 *               assetType: { type: string, enum: [stock, bond, cash] }
 *               amount: { type: number, example: 10000 }
 *               quantity: { type: number, example: 50 }
 *               type: { type: string, enum: [buy, sell] }
 *               purchaseDate: { type: string, example: "2025-07-28" }
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/create', requireAuth, async (ctx) => {
  const newItem = await PortfolioItem.create(ctx.request.body);
  ctx.body = newItem;
});

/**
 * @swagger
 * /api/portfolio-items/update/{id}:
 *   post:
 *     summary: 修改投资组合项目（需登录）
 *     tags: [PortfolioItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               amount: 12000
 *               quantity: 60
 *     responses:
 *       200:
 *         description: 返回更新后的项目
 *       404:
 *         description: 未找到项目
 */
router.post('/update/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await PortfolioItem.update(ctx.request.body, { where: { id: ctx.params.id } });
  if (updatedRowsCount === 0) ctx.throw(404, 'Portfolio item not found');

  const updatedItem = await PortfolioItem.findByPk(ctx.params.id);
  ctx.body = updatedItem;
});

/**
 * @swagger
 * /api/portfolio-items/delete/{id}:
 *   post:
 *     summary: 逻辑删除投资组合项目（需登录）
 *     tags: [PortfolioItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.post('/delete/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await PortfolioItem.update(
    { isDeleted: true },
    { where: { id: ctx.params.id } }
  );
  if (updatedRowsCount === 0) ctx.throw(404, 'Portfolio item not found');

  const deletedItem = await PortfolioItem.findByPk(ctx.params.id);
  ctx.body = { message: 'Portfolio item logically deleted', item: deletedItem };
});

/**
 * @swagger
 * /api/portfolio-items/search:
 *   get:
 *     summary: 分页 + 条件过滤搜索投资组合项目
 *     tags: [PortfolioItems]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer }
 *       - name: pageSize
 *         in: query
 *         schema: { type: integer }
 *       - name: portfolioId
 *         in: query
 *         schema: { type: integer }
 *       - name: assetCode
 *         in: query
 *         schema: { type: string }
 *       - name: assetType
 *         in: query
 *         schema: { type: string }
 *       - name: type
 *         in: query
 *         schema: { type: string }
 *       - name: minAmount
 *         in: query
 *         schema: { type: number }
 *       - name: maxAmount
 *         in: query
 *         schema: { type: number }
 *       - name: startDate
 *         in: query
 *         schema: { type: string }
 *       - name: endDate
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 返回分页后的项目
 */
router.get('/search', async (ctx) => {
  const { page = 1, pageSize = 10, portfolioId, assetCode, assetType, type, minAmount, maxAmount, startDate, endDate } = ctx.query;

  const filter = { isDeleted: false };
  if (portfolioId) filter.portfolioId = portfolioId;
  if (assetCode) filter.assetCode = { [Op.like]: `%${assetCode}%` };
  if (assetType) filter.assetType = assetType;
  if (type) filter.type = type;
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount[Op.gte] = parseFloat(minAmount);
    if (maxAmount) filter.amount[Op.lte] = parseFloat(maxAmount);
  }
  if (startDate || endDate) {
    filter.purchaseDate = {};
    if (startDate) filter.purchaseDate[Op.gte] = new Date(startDate);
    if (endDate) filter.purchaseDate[Op.lte] = new Date(endDate);
  }

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const limit = parseInt(pageSize);

  const { rows: items, count: total } = await PortfolioItem.findAndCountAll({
    where: filter,
    include: [{
      model: Portfolio,
      where: { isDeleted: false },
      required: false
    }],
    limit,
    offset,
    order: [['purchaseDate', 'DESC']]
  });

  ctx.body = { total, page: parseInt(page), pageSize: parseInt(pageSize), items };
});

/**
 * @swagger
 * /api/portfolio-items/portfolio/{portfolioId}/stats:
 *   get:
 *     summary: 获取投资组合项目统计（买卖总额、持仓数等）
 *     tags: [PortfolioItems]
 *     parameters:
 *       - name: portfolioId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 返回统计信息
 */
router.get('/portfolio/:portfolioId/stats', async (ctx) => {
  const portfolioId = ctx.params.portfolioId;
  
  const items = await PortfolioItem.findAll({ where: { portfolioId, isDeleted: false } });

  const stats = {
    totalItems: items.length,
    totalBuyAmount: items.filter(item => item.type === 'buy').reduce((sum, item) => sum + parseFloat(item.amount), 0),
    totalSellAmount: items.filter(item => item.type === 'sell').reduce((sum, item) => sum + parseFloat(item.amount), 0),
    assetTypes: {},
    buyCount: items.filter(item => item.type === 'buy').length,
    sellCount: items.filter(item => item.type === 'sell').length,
    totalQuantity: items.reduce((sum, item) => item.type === 'buy' ? sum + parseFloat(item.quantity) : sum - parseFloat(item.quantity), 0)
  };

  items.forEach(item => {
    const key = `${item.assetType}_${item.type}`;
    if (stats.assetTypes[key]) {
      stats.assetTypes[key].count++;
      stats.assetTypes[key].amount += parseFloat(item.amount);
    } else {
      stats.assetTypes[key] = { count: 1, amount: parseFloat(item.amount), assetType: item.assetType, type: item.type };
    }
  });

  ctx.body = stats;
});

/**
 * @swagger
 * /api/portfolio-items/batch-create:
 *   post:
 *     summary: 批量创建投资组合项目（需登录）
 *     tags: [PortfolioItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   example:
 *                     portfolioId: 1
 *                     assetCode: AAPL
 *                     assetType: stock
 *                     amount: 1000
 *                     quantity: 5
 *                     type: buy
 *     responses:
 *       200:
 *         description: 批量创建成功
 */
router.post('/batch-create', requireAuth, async (ctx) => {
  const { items } = ctx.request.body;
  if (!Array.isArray(items)) ctx.throw(400, 'Items must be an array');

  const createdItems = await PortfolioItem.bulkCreate(items);
  ctx.body = { message: 'Batch create completed', items: createdItems };
});

/**
 * @swagger
 * /api/portfolio-items/portfolio/{portfolioId}/holdings:
 *   get:
 *     summary: 获取持仓汇总（按资产代码分组）
 *     tags: [PortfolioItems]
 *     parameters:
 *       - name: portfolioId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 返回每个资产的净持仓及买卖详情
 */
router.get('/portfolio/:portfolioId/holdings', async (ctx) => {
  const portfolioId = ctx.params.portfolioId;

  const items = await PortfolioItem.findAll({
    where: { portfolioId, isDeleted: false },
    order: [['assetCode', 'ASC'], ['purchaseDate', 'DESC']]
  });

  const holdings = {};
  items.forEach(item => {
    const { assetCode } = item;
    if (!holdings[assetCode]) {
      holdings[assetCode] = {
        assetCode,
        assetType: item.assetType,
        totalQuantity: 0,
        totalAmount: 0,
        buyQuantity: 0,
        sellQuantity: 0,
        buyAmount: 0,
        sellAmount: 0,
        transactions: []
      };
    }

    const holding = holdings[assetCode];
    const quantity = parseFloat(item.quantity);
    const amount = parseFloat(item.amount);

    if (item.type === 'buy') {
      holding.buyQuantity += quantity;
      holding.buyAmount += amount;
      holding.totalQuantity += quantity;
    } else {
      holding.sellQuantity += quantity;
      holding.sellAmount += amount;
      holding.totalQuantity -= quantity;
    }

    holding.totalAmount = holding.buyAmount - holding.sellAmount;
    holding.transactions.push(item);
  });

  ctx.body = Object.values(holdings);
});

module.exports = router;
