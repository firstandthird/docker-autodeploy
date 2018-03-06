module.exports = async function(services, spec, url, payload, debug) {
  const server = this;
  try {
    await services.create(spec);
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
      await services.remove(spec.Name);
      server.log([spec.Name, 'remove'], `Removed ${spec.Name} service`);
    } catch (e2) {
      //eslint-disable-line no-empty
    }
  }
};
