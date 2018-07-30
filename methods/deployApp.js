const runshell = require('runshell');

module.exports = async function(services, name, data) {
  const setStr = [];

  if (data) {
    Object.keys(data).forEach(k => {
      setStr.push(`--set ${k}=${data[k]}`);
    });
  }
  let results = '';
  try {
    await services.dockerClient.pull(name);
    const resultObj = await runshell(`docker pull ${name} && /home/app/docker-app-linux deploy ${name} ${setStr.join(' ')}`, { log: true, verbose: true });

    ({ results } = resultObj);
  } catch (e) {
    throw e;
  }

  return { sucess: 1, results };
};
