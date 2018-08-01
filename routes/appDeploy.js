const Joi = require('joi');
const Boom = require('boom');
const DockerServices = require('@firstandthird/docker-services');

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

    const settings = server.settings.app;
    const secret = settings.secret;
    if (secret && secret !== request.query.secret) {
      throw Boom.unauthorized();
    }

    if (!payload.name) {
      throw Boom.badRequest('name is required');
    }

    const appData = Object.assign({}, payload);
    delete appData.name;

    const servicesOpts = {};
    if (settings.versboseDebug) {
      servicesOpts.listener = (tag, data) => {
        server.log(tag, data);
      };
    }
    const services = new DockerServices(servicesOpts);
    try {
      await server.methods.deployApp(services, payload.name, appData);
    } catch (e) {
      throw Boom.boomify(e, { statusCode: 400 });
    }
    return { success: true };
  }
};
