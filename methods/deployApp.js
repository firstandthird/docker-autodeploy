const runshell = require('runshell');

module.exports = async function(services, image, data) {
  this.log(['docker-app', 'deploy'], { image, data });

  const deployData = {
    __: image,
    'settings-files': data.settingsFile || null,
    set: data.set || {},
    name: data.name || null,
    'with-registry-auth': true
  };

  Object.keys(deployData).forEach(k => {
    if (deployData[k] === null) {
      delete deployData[k];
    }
  });

  const resultObj = await runshell('/home/app/src/bin/deploy-docker-app', {
    log: true,
    verbose: true,
    args: deployData
  });

  this.log([image, 'docker-app', 'deploy', 'success'], { image, data });

  return { sucess: 1, results: resultObj.results };
};
