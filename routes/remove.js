const Boom = require('boom');
const DockerServices = require('@firstandthird/docker-services');

exports.remove = {
  path: '/',
  method: 'DELETE',
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

    const services = new DockerServices();
    try {
      await services.remove(payload.name);
      server.log([payload.name, 'remove', 'success'], `${payload.name} removed`);
      return { status: 'removed' };
    } catch (e) {
      throw Boom.badRequest(`${payload.name} doesn't exist`);
    }
  }
};
