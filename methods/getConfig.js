const parseDir = require('parse-dir');
module.exports = async function() {
  const server = this;
  const settings = server.settings.app;
  const parsed = await parseDir(`${settings.configPath}/*.yaml`);

  const configs = {};
  parsed.forEach(p => {
    configs[p.basename] = p.contents;
  });
  return configs;
};
