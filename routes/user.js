const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = new Router({ prefix: '/api/users' });
const bcrypt = require('bcrypt');

const secret = process.env.JWT_SECRET;

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
    role
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

module.exports = router;