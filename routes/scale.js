const Joi = require('joi');
const Boom = require('boom');
const DockerServices = require('@firstandthird/docker-services');

exports.hook = {
  path: '/scale',
  method: 'PUT',
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
    
    const settings = server.settings.app;
    const secret = settings.secret;
    if (secret && secret !== request.query.secret) {
      throw Boom.unauthorized();
    }
    
    if (!payload.name || !payload.scale) {
      throw Boom.badRequest('name and scale are required');
    }

    const scale = async function(name, scale, debug) {
      const services = new DockerServices();
      const { spec } = await services.scale(name, parseInt(scale));

      const log = {
        message: `${name} scaled to ${scale}`,
      };
      if (debug) {
        log.spec = spec;
      }
      server.log([name, 'update', 'success'], log);
    };

    scale(payload.name, payload.scale, settings.debug);
    return { status: 'scaling' };

  }
};
