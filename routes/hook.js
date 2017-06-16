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
        event: Joi.string().default('start').allow(['start', 'stop']),
        serviceConfig: Joi.object()
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
        const [repo, name] = image.split('/');

        const config = {
          image,
          tag,
          repository: repo,
          name: `${name}_${tag}`,
          serviceConfig: payload.serviceConfig
        };

        //labels array into object
        if (config.serviceConfig && config.serviceConfig.Labels && Array.isArray(config.serviceConfig.Labels)) {
          const labelObj = {};
          config.serviceConfig.Labels.forEach((label) => {
            const [key, value] = label.split('=');
            labelObj[key] = value;
          });
          config.serviceConfig.Labels = labelObj;
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

