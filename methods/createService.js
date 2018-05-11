const util = require('util');

const wait = util.promisify(setTimeout);

module.exports = async function(services, spec, url, payload, debug) {
  const server = this;
  const enableMonitor = server.settings.app.enableMonitor === 'true';
  try {
    await services.create(spec, !enableMonitor);
    const log = {
      message: `${spec.Name} created`,
      url,
      payload
    };
    if (debug) {
      log.spec = spec;
    }
    server.log([spec.Name, 'create', 'success'], log);
  } catch (e) {
    server.log([spec.Name, 'create', 'error'], {
      message: `Error creating ${spec.Name}`,
      error: e.stack || e.message || e
    });

    try {
      server.log([spec.Name, 'remove'], `Removing ${spec.Name} service`);
      await wait(10000);
      await services.remove(spec.Name);
    } catch (e2) {
      //eslint-disable-line no-empty
    }
  }
};
