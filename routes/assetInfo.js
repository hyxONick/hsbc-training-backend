const Router = require('koa-router');
const AssetInfo = require('../models/AssetInfo');
const { Op } = require('sequelize');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/assets' });

/**
 * @swagger
 * components:
 *   schemas:
 *     AssetInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 资产ID
 *         assetCode:
 *           type: string
 *           maxLength: 20
 *           description: 资产代码
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: 资产名称
 *         assetType:
 *           type: string
 *           enum: [stock, bond]
 *           description: 资产类型
 *         price:
 *           type: number
 *           format: decimal
 *           description: 当前价格
 *         currency:
 *           type: string
 *           maxLength: 10
 *           description: 货币单位
 *         historyPriceArt:
 *           type: array
 *           items:
 *             type: number
 *           description: 历史价格数组
 *         dateArr:
 *           type: array
 *           items:
 *             type: string
 *           description: 历史日期数组
 *         isDeleted:
 *           type: boolean
 *           default: false
 *           description: 是否已删除
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     AssetInfoCreate:
 *       type: object
 *       required:
 *         - assetCode
 *         - assetType
 *         - price
 *       properties:
 *         assetCode:
 *           type: string
 *           maxLength: 20
 *           description: 资产代码
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: 资产名称
 *         assetType:
 *           type: string
 *           enum: [stock, bond]
 *           description: 资产类型
 *         price:
 *           type: number
 *           format: decimal
 *           description: 当前价格
 *         currency:
 *           type: string
 *           maxLength: 10
 *           description: 货币单位
 *         historyPriceArt:
 *           type: array
 *           items:
 *             type: number
 *           description: 历史价格数组
 *         dateArr:
 *           type: array
 *           items:
 *             type: string
 *           description: 历史日期数组
 */

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: 获取所有未删除的资产信息
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: 获取资产列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AssetInfo'
 */
router.get('/', async (ctx) => {
  const assets = await AssetInfo.findAll({
    where: { isDeleted: false }
  });
  ctx.body = assets;
});

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: 根据ID获取资产信息
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 资产ID
 *     responses:
 *       200:
 *         description: 获取资产信息成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssetInfo'
 *       404:
 *         description: 资产不存在
 */
router.get('/:id', async (ctx) => {
  const asset = await AssetInfo.findByPk(ctx.params.id);
  if (!asset) {
    ctx.throw(404, 'Asset not found');
  }
  ctx.body = asset;
});

/**
 * @swagger
 * /api/assets/code/{assetCode}:
 *   get:
 *     summary: 根据资产代码获取资产信息
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: assetCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 资产代码
 *     responses:
 *       200:
 *         description: 获取资产信息成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssetInfo'
 *       404:
 *         description: 资产不存在
 */
router.get('/code/:assetCode', async (ctx) => {
  const asset = await AssetInfo.findOne({
    where: { 
      assetCode: ctx.params.assetCode,
      isDeleted: false 
    }
  });
  if (!asset) {
    ctx.throw(404, 'Asset not found');
  }
  ctx.body = asset;
});

/**
 * @swagger
 * /api/assets/create:
 *   post:
 *     summary: 创建资产信息
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssetInfoCreate'
 *     responses:
 *       200:
 *         description: 创建资产成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssetInfo'
 *       401:
 *         description: 未认证
 *       403:
 *         description: 需要管理员权限
 */
router.post('/create', requireAuth, adminOnly, async (ctx) => {
  const newAsset = await AssetInfo.create(ctx.request.body);
  ctx.body = newAsset;
});

// POST: 修改资产信息
router.post('/update/:id', requireAuth, adminOnly, async (ctx) => {
  const [updatedRowsCount] = await AssetInfo.update(
    ctx.request.body,
    {
      where: { id: ctx.params.id }
    }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Asset not found');
  }

  const updatedAsset = await AssetInfo.findByPk(ctx.params.id);
  ctx.body = updatedAsset;
});

// POST: 逻辑删除资产信息
router.post('/delete/:id', requireAuth, adminOnly, async (ctx) => {
  const [updatedRowsCount] = await AssetInfo.update(
    { isDeleted: true },
    { where: { id: ctx.params.id } }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Asset not found');
  }

  const deletedAsset = await AssetInfo.findByPk(ctx.params.id);
  ctx.body = {
    message: 'Asset logically deleted',
    asset: deletedAsset
  };
});

// GET: 分页 + 条件过滤搜索
router.get('/search', async (ctx) => {
  const { 
    page = 1, 
    pageSize = 10, 
    assetType, 
    currency, 
    name,
    assetCode,
    minPrice,
    maxPrice
  } = ctx.query;

  const filter = { isDeleted: false };
  
  if (assetType) filter.assetType = assetType;
  if (currency) filter.currency = currency;
  if (assetCode) filter.assetCode = { [Op.like]: `%${assetCode}%` };
  if (name) filter.name = { [Op.like]: `%${name}%` };
  
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) filter.price[Op.lte] = parseFloat(maxPrice);
  }

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const limit = parseInt(pageSize);

  const { rows: items, count: total } = await AssetInfo.findAndCountAll({
    where: filter,
    limit,
    offset,
    order: [['updatedAt', 'DESC']]
  });

  ctx.body = {
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    items
  };
});

// POST: 批量更新资产价格
router.post('/batch-update-prices', requireAuth, adminOnly, async (ctx) => {
  const { updates } = ctx.request.body; // [{ assetCode, price, historyPriceArt, dateArr }]
  
  if (!Array.isArray(updates)) {
    ctx.throw(400, 'Updates must be an array');
  }

  const results = [];
  for (const update of updates) {
    const { assetCode, price, historyPriceArt, dateArr } = update;
    
    const [updatedRowsCount] = await AssetInfo.update(
      { 
        price, 
        historyPriceArt, 
        dateArr,
        updatedAt: new Date()
      },
      { where: { assetCode, isDeleted: false } }
    );
    
    results.push({
      assetCode,
      updated: updatedRowsCount > 0
    });
  }

  ctx.body = {
    message: 'Batch update completed',
    results
  };
});

module.exports = router;