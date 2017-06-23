'use strict';
const Joi = require('joi');
exports.ui = {
  path: '/ui',
  method: 'GET',
  config: {
    validate: {
      query: {
        secret: Joi.string().required()
      }
    }
  },
  handler(request, reply) {
    const secret = request.query.secret;
    const html = `
      <html>
        <form action="/ui" method="POST">
          <input type="hidden" name="secret" value="${secret}"/>
          <label>Url (optional)</label>
          <input type="text" name="url" value="${request.query.url || ''}"/>
          <label>Slug (optional)</label>
          <input type="text" name="slug" value="${request.query.slug || ''}"/>
          <label>Vars</label>
          <input type="text" name="vars" value=""/>
          <input type="submit" value="Deploy"/>
        </form>
      </html>
    `;
    reply(null, html);
  }
};

exports.uiPost = {
  path: '/ui',
  method: 'POST',
  handler(request, reply) {
    const server = request.server;
    const payload = request.payload;
    if (typeof payload.vars === 'string' && payload.vars !== '') {
      try {
        payload.vars = JSON.parse(payload.vars);
      } catch (e) {
        return reply(e);
      }
    }
    if (!payload.url) {
      delete payload.url;
    }
    if (!payload.slug) {
      delete payload.slug;
    }
    if (!payload.vars) {
      delete payload.vars;
    }
    const secret = payload.secret;
    delete payload.secret;

    server.inject({
      url: `/?secret=${secret}`,
      method: 'POST',
      payload: JSON.stringify(payload)
    }, (res) => {
      if (res.statusCode !== 200) {
        return reply(res.statusMessage).code(res.statusCode);
      }
      reply('ok');
    });
  }
};
