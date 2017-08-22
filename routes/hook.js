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
        event: Joi.string().default('start').allow(['start', 'stop']),
        url: Joi.string(),
        slug: Joi.string(),
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
      config(server, payload, done) {
        server.methods.getConfig(payload, done);
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
      env(config, done) {
        if (!config.TaskTemplate) {
          return done();
        }
        if (!config.TaskTemplate.ContainerSpec.Env) {
          config.TaskTemplate.ContainerSpec.Env = [];
        }
        config.TaskTemplate.ContainerSpec.Env.push(`DEPLOY_UPDATED=${new Date().getTime()}`);
        done();
      },
      run(config, labels, env, settings, server, payload, done) {
        if (settings.swarmMode) {
          //compose
          if (config.version) {
            return server.methods.docker.stackDeploy(config, done);
          }
          return server.methods.docker.swarm(config, done);
        }
        done(new Error('only swarm mode is supported right now'));
      },
      send(run, server, config, payload, reply, done) {
        let message = `Updating ${config.Name || config.name} `;
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

