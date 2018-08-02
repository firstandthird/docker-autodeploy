const runshell = require('runshell');

module.exports = async function(services, name, data) {
  this.log(['docker-app', 'deploy'], { name, data });

  services.pull(name);

  const deployData = {
    f: data.f || null,
    set: data.set || {},
    d: data.d || null,
    name: data.name || null
  };

  Object.keys(deployData).forEach(k => {
    if (deployData[k] === null) {
      delete deployData[k];
    }
  });

  const resultObj = await runshell(`/home/app/docker-app-linux deploy ${name}`, {
    log: true,
    verbose: true,
    args: deployData
  });

  this.log([name, 'docker-app', 'deploy', 'success'], { name, data });

  return { sucess: 1, results: resultObj.results };
};
