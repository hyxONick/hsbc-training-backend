const jwt = require('jsonwebtoken');
const User = require('../models/User');

const secret = process.env.JWT_SECRET;

// 鉴权中间件
async function requireAuth(ctx, next) {
  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { message: 'Authentication required' };
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret); // 解码 token

    // 用 Sequelize 查找用户
    const user = await User.findByPk(decoded.id);

    // 校验用户是否存在、token 是否一致
    if (!user || user.token !== token) {
      ctx.status = 401;
      ctx.body = { message: 'Invalid or expired token, please log in again' };
      return;
    }

    ctx.state.user = user; // 挂载用户信息
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { message: 'Token expired or invalid, please log in again' };
  }
}

// 管理员权限中间件
function adminOnly(ctx, next) {
  if (ctx.state.user?.role !== 'admin') {
    ctx.status = 403;
    ctx.body = { message: 'Admin access only' };
    return;
  }
  return next();
}

module.exports = {
  requireAuth,
  adminOnly
};
