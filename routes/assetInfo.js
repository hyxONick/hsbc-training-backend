const Router = require('koa-router');
const AssetInfo = require('../models/AssetInfo');
const { Op } = require('sequelize');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/assets' });

// GET: 获取所有未删除的资产信息
router.get('/', async (ctx) => {
  const assets = await AssetInfo.findAll({
    where: { isDeleted: false }
  });
  ctx.body = assets;
});

// GET: 根据 ID 获取资产信息
router.get('/:id', async (ctx) => {
  const asset = await AssetInfo.findByPk(ctx.params.id);
  if (!asset) {
    ctx.throw(404, 'Asset not found');
  }
  ctx.body = asset;
});

// GET: 根据资产代码获取资产信息
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

// POST: 创建资产信息
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