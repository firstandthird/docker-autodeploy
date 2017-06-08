'use strict';
const Joi = require('joi');
const Boom = require('boom');
exports.hook = {
  path: '/',
  method: 'POST',
  config: {
    validate: {
      query: {
        secret: Joi.string()
      },
      options: {
        allowUnknown: true
      },
      payload: {
        image: Joi.string(),
        event: Joi.string().default('start').allow(['start', 'stop'])
      }
    }
  },
  handler: {
    autoInject: {
      secret(settings, request, done) {
        const secret = settings.secret;
        if (secret !== request.query.secret) {
          return done(Boom.unauthorized());
        }
        done(null, secret);
      },
      payload(request, done) {
        done(null, request.payload);
      },
      config(settings, payload, request, secret, done) {
        const [image, tag] = payload.image.split(':');
        const config = Object.assign({}, settings.images[image]);
        if (typeof config !== 'object') {
          return done();
        }
        if (config.whitelist && !tag.match(config.whitelist)) {
          return done();
        }
        config.image = image;
        config.tag = tag;
        if (!config.name) {
          const [repo, name] = image.split('/');
          config.repository = repo;
          config.name = `${name}_${tag}`;
        }
        //labels array into object
        if (config.serviceInfo && config.serviceInfo.Labels && Array.isArray(config.serviceInfo.Labels)) {
          const labelObj = {};
          config.serviceInfo.Labels.forEach((label) => {
            const [key, value] = label.split('=');
            labelObj[key] = value;
          });
          config.serviceInfo.Labels = labelObj;
        }
        done(null, config);
      },
      run(config, settings, server, payload, done) {
        if (!config) {
          server.log(['deploy', 'skip'], {
            message: `Skipping ${payload.image}`
          });
          return done();
        }
        server.log(['deploy', 'info'], {
          message: `Starting ${config.name}`,
          image: payload.image
        });
        if (settings.swarmMode) {
          return server.methods.docker.swarm(config, done);
        }
        done(new Error('only swarm mode is supported right now'));
      },
      send(run, server, config, payload, reply, done) {
        server.log(['deploy', 'success'], {
          message: `${config.name} started`,
          image: payload.image
        });
        reply(null, 'ok');
        done();
      }
    }
  }
};

