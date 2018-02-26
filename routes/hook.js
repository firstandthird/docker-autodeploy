const Joi = require('joi');
const Boom = require('boom');
const DockerServices = require('@firstandthird/docker-services');
const parseDir = require('parse-dir');
const varson = require('varson');

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

    const parsed = await parseDir(`${settings.configPath}/*.yaml`);

    const configs = {};
    parsed.forEach(p => {
      configs[p.basename] = p.contents;
    });

    const configKey = payload.config || payload.name;

    const rawConfig = configs[configKey];

    if (!rawConfig) {
      throw Boom.notFound('config not found');
    }

    const context = Object.assign({
      ENV: process.env,
      get(key, fallback) {
        return payload[key] || fallback;
      }
    }, payload);
    const spec = varson(rawConfig, context);

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

    if (settings.debug) {
      server.log(['debug'], {
        spec,
        payload
      });
    }

    const services = new DockerServices();

    const exists = await services.exists(spec.Name);
    if (exists) {
      await services.update(spec);
      server.log([spec.Name, 'update', 'success'], `${spec.Name} updated`);
    } else {
      await services.create(spec);
      server.log([spec.Name, 'create', 'success'], `${spec.Name} created`);
    }
    return { status: 'ok' };
  }
};
