'use strict';
const Joi = require('joi');
const Boom = require('boom');
const Docker = require('dockerode');
const aug = require('aug');
const serviceUpdate = require('docker-service-update');
exports.hook = {
  path: '/',
  method: 'POST',
  config: {
    validate: {
      query: {
        secret: Joi.string()
      },
      payload: {
        name: Joi.string(),
        clone: Joi.string(),
        image: Joi.string(),
        environment: Joi.object(),
        labels: Joi.object()
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
      docker(done) {
        const docker = new Docker();
        done(null, docker);
      },
      auth(server, done) {
        const auth = server.methods.docker.authConfig();
        done(null, auth);
      },
      payload(request, done) {
        done(null, request.payload);
      },
      async update(auth, docker, payload) {
        let specEnv = {};
        if (payload.environment) {
          specEnv = Object.assign({}, specEnv, payload.environment);
        }
        specEnv['UPDATED'] = new Date().getTime();

        const res = await serviceUpdate({
          docker,
          auth,
          serviceName: payload.name,
          fromService: payload.clone,
          image: payload.image,
          labels: payload.labels,
          environment: specEnv
        })
        return res;
      },
      reply(server, update, payload, done) {
        let message = `Updating ${payload.name}`;
        if (payload.domain) {
          message += ` at ${payload.domain}`;
        }
        server.log(['deploy', 'success'], message);
        done(null, 'ok');
      }
    }
  }
};

