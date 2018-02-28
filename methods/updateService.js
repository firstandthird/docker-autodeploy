module.exports = async function(services, spec, url, payload) {
  const server = this;

  const newSpec = services.adjustSpec(spec, {
    image: spec.TaskTemplate.ContainerSpec.Image,
    force: true,
    env: {
      UPDATED: new Date().getTime()
    }
  });
  try {
    await services.update(newSpec);
    server.log([newSpec.Name, 'update', 'success'], {
      message: `${newSpec.Name} updated`,
      url,
      payload
    });
  } catch (e) {
    server.log([newSpec.Name, 'update', 'error'], e);
  }
};
