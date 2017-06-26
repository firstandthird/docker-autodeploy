const Joi = require('joi');
exports.pagedata = {
  path: '/pagedata',
  method: 'POST',
  config: {
    validate: {
      query: {
        secret: Joi.string()
      }
    }
  },
  handler(request, reply) {
    reply('ok');
    const server = request.server;
    server.inject({
      url: `/?secret=${request.query.secret}`,
      method: 'POST',
      payload: JSON.stringify({
        slug: request.payload.slug
      })
    }, (res) => {
      if (res.statusCode !== 200) {
        server.log(['pagedata-hook', 'error'], { statusCode: res.statusCode, message: res.statusMessage });
      }
    });
  }
};
