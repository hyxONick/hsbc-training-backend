const Router = require('koa-router');
const PortfolioItem = require('../models/PortfolioItem');
const Portfolio = require('../models/Porfitoilo');
const AssetInfo = require('../models/AssetInfo');
const { Op } = require('sequelize');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/portfolio-items' });

/**
 * @swagger
 * components:
 *   schemas:
 *     PortfolioItem:
 *       type: object
 *       required:
 *         - portfolioId
 *         - assetCode
 *         - assetType
 *         - amount
 *         - quantity
 *         - type
 *       properties:
 *         id:
 *           type: integer
 *           description: 投资组合项目ID
 *         portfolioId:
 *           type: integer
 *           description: 投资组合ID
 *         assetCode:
 *           type: string
 *           maxLength: 20
 *           description: 资产代码
 *         assetType:
 *           type: string
 *           enum: [stock, bond, cash]
 *           description: 资产类型
 *         amount:
 *           type: number
 *           format: decimal
 *           description: 交易金额
 *         quantity:
 *           type: number
 *           format: decimal
 *           description: 交易数量
 *         type:
 *           type: string
 *           enum: [buy, sell]
 *           description: 交易类型
 *         sellDate:
 *           type: string
 *           format: date-time
 *           description: 卖出日期
 *         purchaseDate:
 *           type: string
 *           format: date-time
 *           description: 购买日期
 *         isDeleted:
 *           type: boolean
 *           default: false
 *           description: 是否删除
 *         Portfolio:
 *           $ref: '#/components/schemas/Portfolio'
 *           description: 所属投资组合
 *     PortfolioItemCreate:
 *       type: object
 *       required:
 *         - portfolioId
 *         - assetCode
 *         - assetType
 *         - amount
 *         - quantity
 *         - type
 *       properties:
 *         portfolioId:
 *           type: integer
 *         assetCode:
 *           type: string
 *           maxLength: 20
 *         assetType:
 *           type: string
 *           enum: [stock, bond, cash]
 *         amount:
 *           type: number
 *           format: decimal
 *         quantity:
 *           type: number
 *           format: decimal
 *         type:
 *           type: string
 *           enum: [buy, sell]
 *         sellDate:
 *           type: string
 *           format: date-time
 *         purchaseDate:
 *           type: string
 *           format: date-time
 * 
 * tags:
 *   - name: PortfolioItem
 *     description: 投资组合项目管理
 */

/**
 * @swagger
 * /api/portfolio-items:
 *   get:
 *     tags: [PortfolioItem]
 *     summary: 获取所有投资组合项目
 *     description: 获取所有未删除的投资组合项目
 *     responses:
 *       200:
 *         description: 成功获取投资组合项目列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PortfolioItem'
 */
router.get('/', async (ctx) => {
  const items = await PortfolioItem.findAll({
    where: { isDeleted: false },
    include: [
      {
        model: Portfolio,
        where: { isDeleted: false },
        required: false
      }
    ]
  });
  ctx.body = items;
});

// GET: 根据 ID 获取投资组合项目
router.get('/:id', async (ctx) => {
  const item = await PortfolioItem.findByPk(ctx.params.id, {
    include: [
      {
        model: Portfolio,
        where: { isDeleted: false },
        required: false
      }
    ]
  });
  if (!item) {
    ctx.throw(404, 'Portfolio item not found');
  }
  ctx.body = item;
});

// GET: 根据投资组合ID获取所有项目
router.get('/portfolio/:portfolioId', async (ctx) => {
  const items = await PortfolioItem.findAll({
    where: { 
      portfolioId: ctx.params.portfolioId,
      isDeleted: false 
    },
    order: [['purchaseDate', 'DESC'], ['sellDate', 'DESC']]
  });
  ctx.body = items;
});

// GET: 根据资产代码获取所有项目
router.get('/asset/:assetCode', async (ctx) => {
  const items = await PortfolioItem.findAll({
    where: { 
      assetCode: ctx.params.assetCode,
      isDeleted: false 
    },
    include: [
      {
        model: Portfolio,
        where: { isDeleted: false },
        required: false
      }
    ],
    order: [['purchaseDate', 'DESC']]
  });
  ctx.body = items;
});

// POST: 创建投资组合项目
router.post('/create', requireAuth, async (ctx) => {
  const newItem = await PortfolioItem.create(ctx.request.body);
  ctx.body = newItem;
});

// POST: 修改投资组合项目
router.post('/update/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await PortfolioItem.update(
    ctx.request.body,
    {
      where: { id: ctx.params.id }
    }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Portfolio item not found');
  }

  const updatedItem = await PortfolioItem.findByPk(ctx.params.id);
  ctx.body = updatedItem;
});

// POST: 逻辑删除投资组合项目
router.post('/delete/:id', requireAuth, async (ctx) => {
  const [updatedRowsCount] = await PortfolioItem.update(
    { isDeleted: true },
    { where: { id: ctx.params.id } }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Portfolio item not found');
  }

  const deletedItem = await PortfolioItem.findByPk(ctx.params.id);
  ctx.body = {
    message: 'Portfolio item logically deleted',
    item: deletedItem
  };
});

// GET: 分页 + 条件过滤搜索
router.get('/search', async (ctx) => {
  const { 
    page = 1, 
    pageSize = 10, 
    portfolioId,
    assetCode,
    assetType,
    type,
    minAmount,
    maxAmount,
    startDate,
    endDate
  } = ctx.query;

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
    include: [
      {
        model: Portfolio,
        where: { isDeleted: false },
        required: false
      }
    ],
    limit,
    offset,
    order: [['purchaseDate', 'DESC']]
  });

  ctx.body = {
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    items
  };
});

// GET: 获取投资组合项目统计
router.get('/portfolio/:portfolioId/stats', async (ctx) => {
  const portfolioId = ctx.params.portfolioId;
  
  const items = await PortfolioItem.findAll({
    where: { 
      portfolioId,
      isDeleted: false 
    }
  });

  const stats = {
    totalItems: items.length,
    totalBuyAmount: items.filter(item => item.type === 'buy')
      .reduce((sum, item) => sum + parseFloat(item.amount), 0),
    totalSellAmount: items.filter(item => item.type === 'sell')
      .reduce((sum, item) => sum + parseFloat(item.amount), 0),
    assetTypes: {},
    buyCount: items.filter(item => item.type === 'buy').length,
    sellCount: items.filter(item => item.type === 'sell').length,
    totalQuantity: items.reduce((sum, item) => {
      return item.type === 'buy' 
        ? sum + parseFloat(item.quantity)
        : sum - parseFloat(item.quantity);
    }, 0)
  };

  // 统计各资产类型
  items.forEach(item => {
    const key = `${item.assetType}_${item.type}`;
    if (stats.assetTypes[key]) {
      stats.assetTypes[key].count++;
      stats.assetTypes[key].amount += parseFloat(item.amount);
    } else {
      stats.assetTypes[key] = {
        count: 1,
        amount: parseFloat(item.amount),
        assetType: item.assetType,
        type: item.type
      };
    }
  });

  ctx.body = stats;
});

// POST: 批量创建投资组合项目
router.post('/batch-create', requireAuth, async (ctx) => {
  const { items } = ctx.request.body;
  
  if (!Array.isArray(items)) {
    ctx.throw(400, 'Items must be an array');
  }

  const createdItems = await PortfolioItem.bulkCreate(items);
  ctx.body = {
    message: 'Batch create completed',
    items: createdItems
  };
});

// GET: 获取持仓汇总（按资产代码分组）
router.get('/portfolio/:portfolioId/holdings', async (ctx) => {
  const portfolioId = ctx.params.portfolioId;
  
  const items = await PortfolioItem.findAll({
    where: { 
      portfolioId,
      isDeleted: false 
    },
    order: [['assetCode', 'ASC'], ['purchaseDate', 'DESC']]
  });

  // 按资产代码分组计算净持仓
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