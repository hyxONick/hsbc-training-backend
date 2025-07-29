const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Koa API Docs',
    version: '1.0.0',
    description: 'API documentation for Koa project',
  },
  servers: [
    {
      url: 'http://localhost:3000', // 修改为你的后端地址
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // 🔥 扫描这些文件里的注释生成文档
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
