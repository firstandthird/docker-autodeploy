const runshell = require('runshell');

module.exports = async function(services, name, data) {
  let set = [];
  if (data) {
    set = data;
  }
  await services.pull(name);
  const resultObj = await runshell(`/home/app/docker-app-linux deploy ${name}`, {
    log: true,
    verbose: true,
    args: {
      set
    }
  });

  return { sucess: 1, results: resultObj.results };
};
