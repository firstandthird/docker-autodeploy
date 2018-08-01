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
  handler(request, h) {
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

    const update = async function(name, debug) {
      const services = new DockerServices();
      const { spec } = await services.adjust(name, {
        force: true,
        env: {
          UPDATED: new Date().getTime()
        }
      });

      const log = {
        message: `${name} redeployed`,
      };
      if (debug) {
        log.spec = spec;
      }
      server.log([name, 'update', 'success'], log);
    };

    update(payload.name, settings.debug);
    return { status: 'redeploying' };
  }
};
