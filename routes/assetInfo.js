const Router = require('koa-router');
const AssetInfo = require('../models/AssetInfo');
const { Op } = require('sequelize');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/assets' });

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: 资产信息管理接口
 */

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: 获取所有未删除的资产信息
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: 返回所有资产信息
 */
router.get('/', async (ctx) => {
  const assets = await AssetInfo.findAll({ where: { isDeleted: false } });
  ctx.body = assets;
});

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: 根据 ID 获取资产信息
 *     tags: [Assets]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 资产ID
 *     responses:
 *       200:
 *         description: 成功返回资产信息
 *       404:
 *         description: 未找到资产
 */
router.get('/:id', async (ctx) => {
  const asset = await AssetInfo.findByPk(ctx.params.id);
  if (!asset) ctx.throw(404, 'Asset not found');
  ctx.body = asset;
});

/**
 * @swagger
 * /api/assets/code/{assetCode}:
 *   get:
 *     summary: 根据资产代码获取资产信息
 *     tags: [Assets]
 *     parameters:
 *       - name: assetCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 资产代码（如AAPL）
 *     responses:
 *       200:
 *         description: 成功返回资产信息
 *       404:
 *         description: 未找到资产
 */
router.get('/code/:assetCode', async (ctx) => {
  const asset = await AssetInfo.findOne({
    where: { assetCode: ctx.params.assetCode, isDeleted: false }
  });
  if (!asset) ctx.throw(404, 'Asset not found');
  ctx.body = asset;
});

/**
 * @swagger
 * /api/assets/create:
 *   post:
 *     summary: 创建资产信息（仅管理员）
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assetCode:
 *                 type: string
 *                 example: AAPL
 *               name:
 *                 type: string
 *                 example: Apple Inc.
 *               assetType:
 *                 type: string
 *                 enum: [stock, bond]
 *                 example: stock
 *               price:
 *                 type: number
 *                 example: 145.5
 *               currency:
 *                 type: string
 *                 example: USD
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/create', requireAuth, adminOnly, async (ctx) => {
  const newAsset = await AssetInfo.create(ctx.request.body);
  ctx.body = newAsset;
});

/**
 * @swagger
 * /api/assets/update/{id}:
 *   post:
 *     summary: 修改资产信息（仅管理员）
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 资产ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               price: 150.5
 *               currency: USD
 *     responses:
 *       200:
 *         description: 更新后的资产信息
 *       404:
 *         description: 未找到资产
 */
router.post('/update/:id', requireAuth, adminOnly, async (ctx) => {
  const [updatedRowsCount] = await AssetInfo.update(ctx.request.body, {
    where: { id: ctx.params.id }
  });

  if (updatedRowsCount === 0) ctx.throw(404, 'Asset not found');

  const updatedAsset = await AssetInfo.findByPk(ctx.params.id);
  ctx.body = updatedAsset;
});

/**
 * @swagger
 * /api/assets/delete/{id}:
 *   post:
 *     summary: 逻辑删除资产信息（仅管理员）
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 资产ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 未找到资产
 */
router.post('/delete/:id', requireAuth, adminOnly, async (ctx) => {
  const [updatedRowsCount] = await AssetInfo.update(
    { isDeleted: true },
    { where: { id: ctx.params.id } }
  );

  if (updatedRowsCount === 0) ctx.throw(404, 'Asset not found');

  const deletedAsset = await AssetInfo.findByPk(ctx.params.id);
  ctx.body = { message: 'Asset logically deleted', asset: deletedAsset };
});

/**
 * @swagger
 * /api/assets/search:
 *   get:
 *     summary: 分页 + 条件过滤搜索资产
 *     tags: [Assets]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: 页码
 *       - name: pageSize
 *         in: query
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - name: assetType
 *         in: query
 *         schema:
 *           type: string
 *         description: 资产类型
 *       - name: currency
 *         in: query
 *         schema:
 *           type: string
 *         description: 币种
 *       - name: assetCode
 *         in: query
 *         schema:
 *           type: string
 *         description: 模糊搜索资产代码
 *       - name: name
 *         in: query
 *         schema:
 *           type: string
 *         description: 模糊搜索资产名称
 *       - name: minPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: 最低价格
 *       - name: maxPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: 最高价格
 *     responses:
 *       200:
 *         description: 分页搜索结果
 */
router.get('/search', async (ctx) => {
  const { page = 1, pageSize = 10, assetType, currency, name, assetCode, minPrice, maxPrice } = ctx.query;

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

  ctx.body = { total, page: parseInt(page), pageSize: parseInt(pageSize), items };
});

/**
 * @swagger
 * /api/assets/batch-update-prices:
 *   post:
 *     summary: 批量更新资产价格（仅管理员）
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     assetCode:
 *                       type: string
 *                       example: AAPL
 *                     price:
 *                       type: number
 *                       example: 155.6
 *                     historyPriceArt:
 *                       type: array
 *                       items: { type: number }
 *                       example: [150, 152, 154]
 *                     dateArr:
 *                       type: array
 *                       items: { type: string }
 *                       example: ["2025-07-01", "2025-07-02"]
 *     responses:
 *       200:
 *         description: 批量更新完成
 */
router.post('/batch-update-prices', requireAuth, adminOnly, async (ctx) => {
  const { updates } = ctx.request.body; // [{ assetCode, price, historyPriceArt, dateArr }]

  if (!Array.isArray(updates)) {
    ctx.throw(400, 'Updates must be an array');
  }

  const results = [];
  for (const update of updates) {
    const { assetCode, price, historyPriceArt, dateArr } = update;
    const [updatedRowsCount] = await AssetInfo.update(
      { price, historyPriceArt, dateArr, updatedAt: new Date() },
      { where: { assetCode, isDeleted: false } }
    );
    results.push({ assetCode, updated: updatedRowsCount > 0 });
  }

  ctx.body = { message: 'Batch update completed', results };
});

/**
 * @swagger
 * /api/assets/{assetCode}/history:
 *   get:
 *     summary: 获取指定资产的历史价格
 *     description: 根据资产代码 (assetCode) 获取该资产的历史日期数组和历史价格数组。
 *     tags:
 *       - Asset
 *     parameters:
 *       - in: path
 *         name: assetCode
 *         required: true
 *         description: 资产代码 (如 AAPL, TSLA)
 *         schema:
 *           type: string
 *           example: AAPL
 *     responses:
 *       200:
 *         description: 成功返回资产历史数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assetCode:
 *                   type: string
 *                   example: AAPL
 *                 name:
 *                   type: string
 *                   example: Apple Inc.
 *                 dateArr:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["2023-07-01", "2023-07-02", "2023-07-03"]
 *                 historyPriceArr:
 *                   type: array
 *                   items:
 *                     type: number
 *                   example: [182.12, 183.45, 185.20]
 *       404:
 *         description: 未找到该资产
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Asset not found
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */
router.get("/:assetCode/history", async (ctx) => {
  try {
    const { assetCode } = ctx.params;

    // ✅ 查询数据库
    const asset = await AssetInfo.findOne({
      where: { assetCode, isDeleted: false }
    });

    if (!asset) {
      ctx.status = 404;
      ctx.body = { message: "Asset not found" };
      return;
    }

    // ✅ 基础数据
    const dateArr = asset.dateArr || [];
    const priceArr = asset.historyPriceArr || [];

    // ✅ 如果数据不足 2 天，给默认值
    const currentPrice = priceArr.length > 0 ? priceArr[priceArr.length - 1] : null;
    const prevPrice = priceArr.length > 1 ? priceArr[priceArr.length - 2] : null;

    // ✅ 计算指标
    const changeAmount = (currentPrice && prevPrice) ? (currentPrice - prevPrice) : 0;
    const changePercent = (prevPrice && prevPrice !== 0) ? ((changeAmount / prevPrice) * 100).toFixed(2) : "0.00";

    const high52w = priceArr.length > 0 ? Math.max(...priceArr) : null;
    const low52w = priceArr.length > 0 ? Math.min(...priceArr) : null;
    const avgPrice = priceArr.length > 0 ? (priceArr.reduce((a, b) => a + b, 0) / priceArr.length).toFixed(2) : null;

    // ✅ 返回给前端
    ctx.body = {
      assetCode: asset.assetCode,
      name: asset.name,
      assetType: asset.assetType,
      currency: asset.currency,
      updatedAt: asset.updatedAt,

      // ✅ 历史数据
      dateArr,
      historyPriceArr: priceArr,

      // ✅ 额外指标
      currentPrice,
      prevPrice,
      changeAmount: changeAmount.toFixed(2),
      changePercent,
      high52w,
      low52w,
      avgPrice
    };

  } catch (err) {
    console.error("❌ 获取资产历史数据失败:", err);
    ctx.status = 500;
    ctx.body = { message: "Internal Server Error" };
  }
});


module.exports = router;