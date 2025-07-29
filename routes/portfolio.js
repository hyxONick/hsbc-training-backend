const Router = require('koa-router');
const Portfolio = require('../models/Portfolio');
const PortfolioItem = require('../models/PortfolioItem');
const { Op } = require('sequelize');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/portfolios' });

// GET: 获取所有未删除的投资组合
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

// GET: 根据 ID 获取投资组合
router.get('/:id', async (ctx) => {
  const portfolio = await Portfolio.findByPk(ctx.params.id, {
    include: [{
      model: PortfolioItem,
      where: { isDeleted: false },
      required: false
    }]
  });
  if (!portfolio) {
    ctx.throw(404, 'Portfolio not found');
  }
  ctx.body = portfolio;
});

// GET: 根据用户ID获取用户的所有投资组合
router.get('/user/:userId', async (ctx) => {
  const portfolios = await Portfolio.findAll({
    where: { 
      userId: ctx.params.userId,
      isDeleted: false 
    },
    include: [{
      model: PortfolioItem,
      where: { isDeleted: false },
      required: false
    }],
    order: [['createdAt', 'DESC']]
  });
  ctx.body = portfolios;
});

// POST: 创建投资组合
router.post('/create', requireAuth, async (ctx) => {
  const newPortfolio = await Portfolio.create(ctx.request.body);
  ctx.body = newPortfolio;
});

// POST: 修改投资组合
router.post('/update/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await Portfolio.update(
    ctx.request.body,
    {
      where: { id: ctx.params.id }
    }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Portfolio not found');
  }

  const updatedPortfolio = await Portfolio.findByPk(ctx.params.id, {
    include: [{
      model: PortfolioItem,
      where: { isDeleted: false },
      required: false
    }]
  });
  ctx.body = updatedPortfolio;
});

// POST: 逻辑删除投资组合
router.post('/delete/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await Portfolio.update(
    { isDeleted: true },
    { where: { id: ctx.params.id } }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Portfolio not found');
  }

  const deletedPortfolio = await Portfolio.findByPk(ctx.params.id);
  ctx.body = {
    message: 'Portfolio logically deleted',
    portfolio: deletedPortfolio
  };
});

// GET: 分页 + 条件过滤搜索
router.get('/search', async (ctx) => {
  const { 
    page = 1, 
    pageSize = 10, 
    userId,
    name
  } = ctx.query;

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

  ctx.body = {
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    items
  };
});

// GET: 获取投资组合统计信息
router.get('/:id/stats', async (ctx) => {
  const portfolioId = ctx.params.id;
  
  const portfolio = await Portfolio.findByPk(portfolioId);
  if (!portfolio) {
    ctx.throw(404, 'Portfolio not found');
  }

  const items = await PortfolioItem.findAll({
    where: { 
      portfolioId,
      isDeleted: false 
    }
  });

  const stats = {
    totalItems: items.length,
    totalAmount: items.reduce((sum, item) => sum + parseFloat(item.amount), 0),
    assetTypes: {},
    buyCount: items.filter(item => item.type === 'buy').length,
    sellCount: items.filter(item => item.type === 'sell').length
  };

  // 统计各资产类型数量
  items.forEach(item => {
    if (stats.assetTypes[item.assetType]) {
      stats.assetTypes[item.assetType]++;
    } else {
      stats.assetTypes[item.assetType] = 1;
    }
  });

  ctx.body = {
    portfolio,
    stats
  };
});

module.exports = router;