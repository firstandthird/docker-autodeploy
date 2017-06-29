'use strict';
const Joi = require('joi');
const Boom = require('boom');
const runshell = require('runshell');
const wreck = require('wreck');
const obj2args = require('obj2args');
exports.hook = {
  path: '/',
  method: 'POST',
  config: {
    validate: {
      query: {
        secret: Joi.string()
      },
      payload: {
        user: Joi.string(),
        repo: Joi.string(),
        branch: Joi.string(),
        commit: Joi.string(),
        dockerImage: Joi.string(),
        image: Joi.string(),
        event: Joi.string().default('push').allow(['push', 'delete'])
      }
    }
  },
  handler: {
    autoInject: {
      config(request, done) {
        const config = request.server.settings.app;
        done(null, config);
      },
      secret(config, request, done) {
        const secret = config.secret;
        if (secret !== request.query.secret) {
          return done(Boom.unauthorized());
        }
        done(null, secret);
      },
      envConfig(config, done) {
        if (!config.envEndpoint) {
          return done(null, {});
        }

        wreck.get(config.envEndpoint, { json: true }, (err, res, payload) => {
          if (err) {
            return done(err);
          }
          done(null, payload);
        });
      },
      payload(request, done) {
        if (request.payload.image && !request.payload.dockerImage) {
          request.payload.dockerImage = request.payload.image;
        }
        done(null, request.payload);
      },
      args(envConfig, payload, done) {
        const repoEnv = envConfig[payload.repo];
        if (!repoEnv) {
          return done();
        }
        const env = repoEnv[payload.branch] || repoEnv['*'] || {};
        const args = obj2args({ e: env });
        done(null, args);
      },
      run(payload, secret, args, config, done) {
        console.log(payload, args);
        runshell(config.deployScript, {
          env: {
            GITHUB_USER: payload.user,
            GITHUB_REPO: payload.repo,
            GITHUB_BRANCH: payload.branch,
            DOCKER_IMAGE: payload.dockerImage,
            DOCKER_ARGS: args || '',
            EVENT: payload.event
          },
          log: true
        });
        done();
      },
      reply(secret, done) {
        done(null, 'ok');
      }
    }
  }
};

