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
        <form action="/hook?secret${secret}" method="POST">
          <label>Name</label>
          <input type="text" name="name" value=""/>
          <label>Image</label>
          <input type="text" name="image" value=""/>
          <input type="submit" value="Deploy"/>
        </form>
      </html>
    `;
    reply(null, html);
  }
};
