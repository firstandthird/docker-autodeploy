module.exports = async function(services, spec, url, payload) {
  const server = this;
  try {
    await services.create(spec);
    server.log([spec.Name, 'create', 'success'], {
      message: `${spec.Name} created`,
      url,
      payload
    });
  } catch (e) {
    server.log([spec.Name, 'create', 'error'], e);
  }
};
