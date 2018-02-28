const Joi = require('joi');
const Boom = require('boom');
const DockerServices = require('@firstandthird/docker-services');

exports.hook = {
  path: '/redeploy',
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

    const settings = server.settings.app;
    const secret = settings.secret;
    if (secret && secret !== request.query.secret) {
      throw Boom.unauthorized();
    }

    const services = new DockerServices();
    await services.adjust(payload.name, {
      force: true,
      env: {
        UPDATED: new Date().getTime()
      }
    });

    return { status: 'redeploying' };
  }
};
