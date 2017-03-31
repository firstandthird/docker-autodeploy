const Joi = require('joi');
const Boom = require('boom');
const runshell = require('runshell');
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
        dockerImage: Joi.string()
      }
    }
  },
  handler(request, reply) {
    const config = request.server.settings.app;
    const secret = config.secret;
    if (secret !== request.query.secret) {
      return reply(Boom.unauthorized());
    }

    reply('ok');

    const payload = request.payload;
    runshell(config.deployScript, {
      env: {
        GITHUB_USER: payload.user,
        GITHUB_REPO: payload.repo,
        GITHUB_BRANCH: payload.branch,
        DOCKER_IMAGE: payload.dockerImage
      },
      log: true
    });
  }
};

