const Router = require('koa-router');
const Cloth = require('../models/Cloth');
const { Op } = require('sequelize');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/cloths' });

/**
 * @swagger
 * components:
 *   schemas:
 *     Cloth:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 服装ID
 *         type:
 *           type: string
 *           description: 服装类型
 *         size:
 *           type: string
 *           description: 尺寸
 *           default: M
 *         color:
 *           type: string
 *           description: 颜色
 *           default: white
 *         material:
 *           type: string
 *           description: 材质
 *         price:
 *           type: number
 *           format: float
 *           description: 价格
 *         isDeleted:
 *           type: boolean
 *           description: 是否已删除
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     ClothCreate:
 *       type: object
 *       required:
 *         - type
 *         - price
 *       properties:
 *         type:
 *           type: string
 *           description: 服装类型
 *         size:
 *           type: string
 *           description: 尺寸
 *           default: M
 *         color:
 *           type: string
 *           description: 颜色
 *           default: white
 *         material:
 *           type: string
 *           description: 材质
 *         price:
 *           type: number
 *           format: float
 *           description: 价格
 */

/**
 * @swagger
 * /api/cloths:
 *   get:
 *     summary: 获取所有未删除的服装
 *     tags: [Cloths]
 *     responses:
 *       200:
 *         description: 获取服装列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cloth'
 */
router.get('/', async (ctx) => {
  const cloths = await Cloth.findAll({
    where: { isDeleted: false }
  });
  ctx.body = cloths;
});

/**
 * @swagger
 * /api/cloths/{id}:
 *   get:
 *     summary: 根据ID获取服装
 *     tags: [Cloths]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 服装ID
 *     responses:
 *       200:
 *         description: 获取服装成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cloth'
 *       404:
 *         description: 服装不存在
 */
router.get('/:id', async (ctx) => {
  const cloth = await Cloth.findByPk(ctx.params.id);
  if (!cloth) {
    ctx.throw(404, 'Cloth not found');
  }
  ctx.body = cloth;
});

/**
 * @swagger
 * /api/cloths/create:
 *   post:
 *     summary: 创建服装
 *     tags: [Cloths]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClothCreate'
 *     responses:
 *       200:
 *         description: 创建服装成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cloth'
 *       401:
 *         description: 未认证
 *       403:
 *         description: 需要管理员权限
 */
router.post('/create', requireAuth, adminOnly, async (ctx) => {
  const newCloth = await Cloth.create(ctx.request.body);
  ctx.body = newCloth;
});

// POST: 修改 cloth
router.post('/update/:id', requireAuth, adminOnly, async (ctx) => {
  const [updatedRowsCount, updatedRows] = await Cloth.update(
    ctx.request.body,
    {
      where: { id: ctx.params.id },
      returning: true // PostgreSQL only, for MySQL use findByPk again
    }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Cloth not found');
  }

  const updatedCloth = await Cloth.findByPk(ctx.params.id);
  ctx.body = updatedCloth;
});

// POST: 逻辑删除 cloth
router.post('/delete/:id', requireAuth, adminOnly, async (ctx) => {
  const [updatedRowsCount] = await Cloth.update(
    { isDeleted: true },
    { where: { id: ctx.params.id } }
  );

  if (updatedRowsCount === 0) {
    ctx.throw(404, 'Cloth not found');
  }

  const deletedCloth = await Cloth.findByPk(ctx.params.id);
  ctx.body = {
    message: 'Cloth logically deleted',
    cloth: deletedCloth
  };
});

// GET: 分页 + 条件过滤
router.get('/search', async (ctx) => {
  const { page = 1, pageSize = 10, color, size } = ctx.query;

  const filter = { isDeleted: false };
  if (color) filter.color = color;
  if (size) filter.size = size;

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const limit = parseInt(pageSize);

  const { rows: items, count: total } = await Cloth.findAndCountAll({
    where: filter,
    limit,
    offset
  });

  ctx.body = {
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    items
  };
});

module.exports = router;
