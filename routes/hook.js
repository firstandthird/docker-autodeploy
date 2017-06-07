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
        const config = settings.images[image];
        if (!config) {
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
          config.name = name;
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
        if (settings.swarmMode) {
          return server.methods.docker.swarm(config, done);
        }
        done(new Error('only swarm mode is supported right now'));
      },
      send(run, reply, done) {
        reply(null, 'ok');
        done();
      }
    }
  }
};

