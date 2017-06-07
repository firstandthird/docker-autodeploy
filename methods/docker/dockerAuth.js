const fs = require('fs');
const path = require('path');
const os = require('os');
module.exports = function(done) {
  const dockerConfig = path.join(os.homedir(), '.docker/config.json');
  if (fs.existsSync(dockerConfig)) {
    const config = require(dockerConfig);
    const addr = 'https://index.docker.io/v1/';
    const auth = config.auths[addr].auth;
    const authBuf = new Buffer(auth, 'base64').toString('utf8');
    const [user, pass] = authBuf.split(':');
    return {
      serveraddress: addr,
      username: user,
      password: pass
    };
  }

  return {};
};
