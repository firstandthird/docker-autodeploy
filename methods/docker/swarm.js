const async = require('async');
const Docker = require('dockerode');

module.exports = function(config, allDone) {
  const server = this;
  async.autoInject({
    docker(done) {
      const docker = new Docker();
      done(null, docker);
    },
    service(docker, done) {
      const service = docker.getService(config.name);
      done(null, service);
    },
    inspect(service, done) {
      service.inspect((err, info) => {
        if (err) {
          if (err.statusCode === 404) {
            //servie not found
            return done();
          }
          return done(err);
        }
        done(null, info);
      });
    },
    start(docker, inspect, done) {
      if (inspect) {
        return done();
      }
      const auth = server.methods.docker.authConfig();
      const defaults = {
        authconfig: auth,
        Name: config.name,
        TaskTemplate: {
          ContainerSpec: {
            Image: `${config.image}:${config.tag}`
          }
        }
      };
      const task = Object.assign(defaults, config.serviceInfo || {});
      docker.createService(task, done);
    },
    update(docker, service, inspect, done) {
      if (!inspect) {
        return done();
      }
      const defaults = {
        Name: config.name,
        version: parseInt(inspect.Version.Index, 10),
        TaskTemplate: {
          ContainerSpec: {
            Image: `${config.image}:${config.tag}`,
          },
          ForceUpdate: 1
        }
      };
      const task = Object.assign(defaults, config.serviceInfo || {});
      service.update(task, done);
    }
  }, (err, results) => {
    allDone(err);
  });
};
