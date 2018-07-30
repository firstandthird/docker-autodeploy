const Joi = require('joi');
const Boom = require('boom');

exports.appDeploy = {
  path: '/docker-app',
  method: 'POST',
  config: {
    validate: {
      query: {
        secret: Joi.string()
      }
    }
  },
  async handler(request, h) {
    const server = request.server;
    const payload = request.payload;

    if (!payload.name) {
      throw Boom.badRequest('name is required');
    }

    await server.methods.deployApp(payload.name, payload);

    return { success: true };
  }
};
