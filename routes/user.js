const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/users' });
const bcrypt = require('bcrypt');

const secret = process.env.JWT_SECRET;

router.post('/register', async (ctx) => {
  const { username, password, role = 'user', email = 'test@gmail.com' } = ctx.request.body;

  const existing = await User.findOne({ where: { username } });
  if (existing) {
    ctx.status = 409;
    ctx.body = { message: 'Username already exists' };
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    username,
    password: hashed,
    role,
    email
  });

  ctx.status = 201;
  ctx.body = { message: 'Registered' };
});

router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body;

  const user = await User.findOne({ where: { username } });
  if (!user) {
    ctx.status = 401;
    ctx.body = { message: 'Invalid credentials' };
    return;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    ctx.status = 401;
    ctx.body = { message: 'Invalid credentials' };
    return;
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '1h' });

  user.token = token;
  await user.save();

  ctx.body = {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
});

/**
 * 获取用户信息 (需要登录)
 */
router.get('/:id', requireAuth, async (ctx) => {
  const user = await User.findByPk(ctx.params.id, {
    attributes: ['id', 'username', 'role', 'createdAt', 'updatedAt'] // 不返回密码和 token
  });

  if (!user) {
    ctx.status = 404;
    ctx.body = { message: 'User not found' };
    return;
  }

  ctx.body = user;
});

/**
 * 修改用户角色 (需要管理员权限)
 */
router.post('/:id/role', requireAuth, adminOnly, async (ctx) => {
  const { role } = ctx.request.body;

  // 仅允许 'admin' 或 'user'
  if (!['admin', 'user'].includes(role)) {
    ctx.status = 400;
    ctx.body = { message: 'Invalid role' };
    return;
  }

  const user = await User.findByPk(ctx.params.id);
  if (!user) {
    ctx.status = 404;
    ctx.body = { message: 'User not found' };
    return;
  }

  user.role = role;
  await user.save();

  ctx.body = {
    message: 'Role updated successfully',
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
});

module.exports = router;