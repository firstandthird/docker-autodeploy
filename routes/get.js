const Boom = require('boom');
exports.getAll = {
  path: '/',
  method: 'get',
  async handler(request, h) {
    const settings = request.server.settings.app;
    const secret = settings.secret;
    if (secret && secret !== request.query.secret) {
      throw Boom.unauthorized();
    }

    const configs = await request.server.methods.getConfig();
    return Object.keys(configs);
  }
};

exports.getConfig = {
  path: '/{config}',
  method: 'get',
  async handler(request, h) {
    const settings = request.server.settings.app;
    const secret = settings.secret;
    if (secret && secret !== request.query.secret) {
      throw Boom.unauthorized();
    }

    const configs = await request.server.methods.getConfig();
    return configs[request.params.config];
  }
};
