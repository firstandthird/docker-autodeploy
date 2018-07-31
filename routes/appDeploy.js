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

    const appData = Object.assign({}, payload);
    delete appData.name;

    try {
      await server.methods.deployApp(payload.name, appData);
    } catch (e) {
      throw Boom.boomify(e, { statusCode: 400 });
    }
    return { success: true };
  }
};
