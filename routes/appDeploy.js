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

    if (!payload.name) {
      throw Boom.badRequest('name is required');
    }

    const settings = request.server.settings.app;

    const servicesOpts = {
      monitorFor: settings.monitorFor,
      waitDelay: settings.waitDelay
    };
    if (settings.verboseDebug) {
      servicesOpts.listener = (tag, data) => {
        server.log(tag, data);
      };
    }
    const services = new DockerServices(servicesOpts);

    await server.methods.deployApp(services, payload.name, payload);

    return { success: true };
  }
};
