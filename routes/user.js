const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth, adminOnly } = require('../middleware/auth');

const router = new Router({ prefix: '/api/users' });
const bcrypt = require('bcrypt');

const secret = process.env.JWT_SECRET;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 用户ID
 *         username:
 *           type: string
 *           description: 用户名
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: 用户角色
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *     UserRegister:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: 用户名
 *         password:
 *           type: string
 *           description: 密码
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: 用户角色
 *     UserLogin:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: 用户名
 *         password:
 *           type: string
 *           description: 密码
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registered
 *       409:
 *         description: 用户名已存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username already exists
 */
router.post('/register', async (ctx) => {
  const { username, password, role = 'user' } = ctx.request.body;

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
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT令牌
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 登录凭据无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
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
 *     summary: 获取用户信息
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 获取用户信息成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       401:
 *         description: 未认证
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
 *     summary: 修改用户角色
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
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
 *                 enum: [user, admin]
 *                 description: 新的用户角色
 *     responses:
 *       200:
 *         description: 角色更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: 无效的角色
 *       404:
 *         description: 用户不存在
 *       401:
 *         description: 未认证
 *       403:
 *         description: 需要管理员权限
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