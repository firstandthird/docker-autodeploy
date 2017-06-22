'use strict';
const Joi = require('joi');
const Boom = require('boom');
const confi = require('confi');
const Docker = require('dockerode');
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
        event: Joi.string().default('start').allow(['start', 'stop']),
        url: Joi.string(),
        vars: Joi.object()
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
      config(settings, payload, done) {
        confi({
          url: payload.url,
          context: payload.vars
        }, done);
      },
      labels(config, done) {
        //labels array into object
        if (config && config.Labels && Array.isArray(config.Labels)) {
          const labelObj = {};
          config.Labels.forEach((label) => {
            const [key, value] = label.split('=');
            labelObj[key] = value;
          });
          config.Labels = labelObj;
        }
        done(null, config);
      },
      pull(config, server, payload, done) {
        const auth = server.methods.docker.authConfig();
        const docker = new Docker();
        docker.pull(config.TaskTemplate.ContainerSpec.Image, { authconfig: auth }, done);
      },
      run(config, labels, settings, server, payload, pull, done) {
        server.log(['deploy', 'info'], `Starting ${config.Name}`);
        if (settings.swarmMode) {
          return server.methods.docker.swarm(config, done);
        }
        done(new Error('only swarm mode is supported right now'));
      },
      send(run, server, config, payload, reply, done) {
        let message = `${config.Name} started`;
        if (config.domain) {
          message += ` at ${config.domain}`;
        }
        server.log(['deploy', 'success'], message);
        reply(null, 'ok');
        done();
      }
    }
  }
};

