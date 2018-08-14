const Url = require('url');
const Qs = require('qs');

const register = (server, opts) => {
  server.ext({
    type: 'onRequest',
    method(request, h) {
      const uri = request.raw.req.url;
      const parsed = Url.parse(uri, false);
      parsed.query = Qs.parse(parsed.query);

      request.setUrl(parsed);

      return h.continue;
    }
  });

  server.ext({
    type: 'onPostAuth',
    method(request, h) {
      if (typeof request.payload === 'object' && !Buffer.isBuffer(request.payload)) {
        request.payload = Qs.parse(request.payload);
      }

      return h.continue;
    }
  });
};


exports.plugin = {
  register,
  once: true,
  pkg: require('../package.json')
};
