const Router = require('koa-router');
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

module.exports = router;
