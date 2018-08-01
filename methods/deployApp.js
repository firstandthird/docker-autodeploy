const runshell = require('runshell');

module.exports = async function(services, name, data) {
  this.log(['docker-app', 'deploy'], { name, data });

  services.pull(name);

  const resultObj = await runshell(`docker pull ${name} && /home/app/docker-app-linux deploy ${name}`, {
    log: true,
    verbose: true,
    args: data || {}
  });

  this.log([name, 'docker-app', 'deploy', 'success'], { name, data });

  return { sucess: 1, results: resultObj.results };
};
