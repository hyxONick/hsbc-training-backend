const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcrypt');

const router = new Router({ prefix: '/api/users' });
const secret = process.env.JWT_SECRET;

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户管理接口
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 example: 123456
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *               role:
 *                 type: string
 *                 example: user
 *     responses:
 *       201:
 *         description: 注册成功
 *       409:
 *         description: 用户名已存在
 */
router.post('/register', async (ctx) => {
  const { username, password, role = 'user', email = 'test@gmail.com' } = ctx.request.body;

  const existing = await User.findOne({ where: { username } });
  if (existing) {
    ctx.status = 409;
    ctx.body = { message: 'Username already exists' };
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.create({ username, password: hashed, role, email });

  ctx.status = 201;
  ctx.body = { message: 'Registered' };
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: 登录成功并返回 token
 *       401:
 *         description: 用户名或密码错误
 */
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
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 获取用户信息（需登录）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 返回用户信息（不含密码）
 *       404:
 *         description: 用户不存在
 *       401:
 *         description: 未登录或 Token 过期
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
 * @swagger
 * /api/users/{id}/role:
 *   post:
 *     summary: 修改用户角色（需管理员权限）
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 example: admin
 *     responses:
 *       200:
 *         description: 角色修改成功
 *       400:
 *         description: 无效的角色
 *       404:
 *         description: 用户不存在
 *       403:
 *         description: 仅管理员可操作
 */
router.post('/:id/role', requireAuth, adminOnly, async (ctx) => {
  const { role } = ctx.request.body;

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