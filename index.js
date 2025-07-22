require('dotenv').config();
const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');

const sequelize = require('./config/database'); // ✅ Sequelize 实例
const User = require('./models/User');
const Cloth = require('./models/Cloth');

const clothRoutes = require('./routes/cloth');
const userRoutes = require('./routes/user');

const app = new Koa();
app.use(cors());
const router = new Router();

// app.use(cors({
//     origin: (ctx) => {
//       // 允许的域名白名单
//       const whitelist = ['http://localhost:3000', 'https://yourdomain.com'];
//       if (whitelist.includes(ctx.request.header.origin)) {
//         return ctx.request.header.origin;
//       }
//       return ''; // 不允许跨域
//     },
//     credentials: true,             // 允许携带 cookie
//     allowMethods: ['GET', 'POST'], // 允许的请求方法
//     allowHeaders: ['Content-Type', 'Authorization'] // 允许的请求头
//   }));

// ✅ 连接 MySQL 并同步模型
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected');

    await sequelize.sync(); // ⚠️ 初期开发使用 sync；上线请使用 migration 工具
    console.log('✅ Models synced');
  } catch (err) {
    console.error('❌ MySQL Connection Error:', err);
  }
})();

// ✅ 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { message: err.message };
    ctx.app.emit('error', err, ctx);
  }
});

// ✅ 通用中间件
app.use(logger());
app.use(bodyParser());

// ✅ 路由挂载
app.use(clothRoutes.routes()).use(clothRoutes.allowedMethods());
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());

// ✅ 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
