module.exports = async function(services, spec, url, payload, debug) {
  const server = this;
  const enableMonitor = server.settings.app.enableMonitor === 'true';
  const newSpec = services.adjustSpec(spec, {
    image: spec.TaskTemplate.ContainerSpec.Image,
    force: true,
    env: {
      UPDATED: new Date().getTime()
    }
  }, !enableMonitor);
  try {
    const results = await services.update(newSpec);
    const log = {
      message: `${newSpec.Name} updated`,
      url,
      payload
    };
    if (debug) {
      log.spec = results.spec;
    }
    server.log([newSpec.Name, 'update', 'success'], log);
  } catch (e) {
    server.log([newSpec.Name, 'update', 'error'], {
      message: `Error updating ${newSpec.Name}`,
      error: e.stack || e.message || e
    });
  }
};
