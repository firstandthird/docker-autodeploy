const runshell = require('runshell');

module.exports = async function(services, name, data) {
  let set = [];
  if (data) {
    set = data;
  }
  const resultObj = await runshell(`docker pull ${name} && /home/app/docker-app-linux deploy ${name}`, {
    log: true,
    verbose: true,
    args: {
      set
    }
  });

  return { sucess: 1, results: resultObj.results };
};
