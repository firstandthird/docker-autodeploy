const varson = require('varson');
const confi = require('confi');
module.exports = function(options, done) {
  const server = this;
  if (options.slug) {
    server.methods.pagedata.getPageContent(options.slug, (err, config) => {
      if (err) {
        return done(err);
      }
      const out = varson(config, options.vars);
      done(null, out);
    });
    return;
  }
  if (options.url) {
    confi({
      url: options.url,
      context: options.vars
    }, done);
    return;
  }
  done(null, {});
};
