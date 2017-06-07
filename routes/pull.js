const Boom = require('boom');
const Docker = require('dockerode');
exports.pull = {
  path: '/pull',
  method: 'get',
  handler(request, reply) {
    const image = request.query.image;
    if (!image) {
      return reply(Boom.badRequest());
    }
    const server = request.server;
    const auth = server.methods.docker.authConfig();
    const docker = new Docker();
    docker.pull(image, { authconfig: auth }, (err, stream) => {
      if (err) {
        request.server.log(['error'], err);
        return reply(err);
      }
      reply(null, 'ok');
    });
  }
};

