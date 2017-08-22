const async = require('async');
const tmp = require('tmp');
const runshell = require('runshell');
const fs = require('fs');
const jsYaml = require('js-yaml');
module.exports = function(config, allDone) {
  async.autoInject({
    tmpFile(done) {
      tmp.file(done);
    },
    name(done) {
      const name = config.name;
      if (!name) {
        return done(new Error('must set stack name'));
      }
      done(null, name);
    },
    yaml(name, done) {
      const configClone = Object.assign({}, config);
      delete configClone.name;
      const y = jsYaml.safeDump(configClone);
      done(null, y);
    },
    configFile(yaml, tmpFile, done) {
      fs.writeFile(tmpFile[0], yaml, done);
    },
    run(name, configFile, tmpFile, done) {
      runshell('docker', {
        verbose: true,
        log: true,
        args: {
          _: ['stack', 'deploy'],
          prune: true,
          'with-registry-auth': true,
          c: tmpFile[0],
          __: name
        }
      }, done);
    },
    cleanup(tmpFile, run, done) {
      tmpFile[2]();
      done();
    }
  }, allDone);
};
