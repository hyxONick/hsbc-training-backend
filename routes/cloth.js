const Router = require('koa-router');
const Cloth = require('../models/Cloth');
const { Op } = require('sequelize');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/cloths' });

// GET: 获取所有未删除的 cloths
router.get('/', async (ctx) => {
  const cloths = await Cloth.findAll({
    where: { isDeleted: false }
  });
  ctx.body = cloths;
});

// GET: 根据 ID 获取 cloth（包含已删除）
router.get('/:id', async (ctx) => {
  const cloth = await Cloth.findByPk(ctx.params.id);
  if (!cloth) {
    ctx.throw(404, 'Cloth not found');
  }
  ctx.body = cloth;
});

// POST: 创建 cloth
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
