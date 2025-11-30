/**
 * Swagger/OpenAPI Documentation Configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Advertising Platform API',
      version: '1.0.0',
      description: 'Complete AI-powered advertising platform with multi-platform deployment, optimization, and real-time monitoring',
      contact: {
        name: 'LongSang Admin',
        email: 'admin@longsang.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.yourdomain.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './services/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

