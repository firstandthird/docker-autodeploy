const Joi = require('joi');
const Boom = require('boom');
const DockerServices = require('@firstandthird/docker-services');
const varson = require('varson');
const compose2api = require('docker-compose-to-api');

exports.hook = {
  path: '/',
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

    const configs = await server.methods.getConfig();

    const configKey = payload.config || payload.name;

    const rawConfig = configs[configKey];

    if (!rawConfig) {
      throw Boom.notFound('config not found');
    }

    if (!rawConfig._type) {
      server.log([configKey, 'config', 'warning'], 'Configs will default to compose in the next verison');
    }

    const context = Object.assign({
      ENV: process.env,
      get(key, fallback) {
        return payload[key] || fallback;
      }
    }, payload);
    let spec = null;
    try {
      spec = varson(rawConfig, context);
    } catch (e) {
      throw Boom.badRequest(e);
    }

    if (spec._type === 'compose') {
      try {
        spec = compose2api(rawConfig[configKey]);
      } catch (e) {
        throw Boom.badRequest(e);
      }
    }

    const replaceGoTmpl = function(str) {
      if (!str || str.indexOf('{!') === -1) {
        return str;
      }
      return str.replace('{!', '{{').replace('!}', '}}');
    };
    spec.TaskTemplate.ContainerSpec.Hostname = replaceGoTmpl(spec.TaskTemplate.ContainerSpec.Hostname);
    if (spec.TaskTemplate.ContainerSpec.Env) {
      spec.TaskTemplate.ContainerSpec.Env = spec.TaskTemplate.ContainerSpec.Env.map(e => replaceGoTmpl(e));
    }

    const services = new DockerServices();

    const exists = await services.exists(spec.Name);
    let status = 'created';
    if (exists) {
      server.methods.updateService(services, spec, url, payload, settings.debug);
      status = 'updated';
    } else {
      server.methods.createService(services, spec, url, payload, settings.debug);
    }
    return { status };
  }
};
