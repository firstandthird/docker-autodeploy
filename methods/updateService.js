module.exports = async function(services, name, url, payload) {
  const server = this;
  try {
    await services.adjust(name, {
      force: true,
      env: {
        UPDATED: new Date().getTime()
      }
    });
    server.log([name, 'update', 'success'], {
      message: `${name} updated`,
      url,
      payload
    });
  } catch (e) {
    server.log([name, 'update', 'error'], e);
  }
};
