const async = require('async');

module.exports = function(config, allDone) {
  async.autoInject({
    docker(server, done) {
      const docker = server.methods.docker.dockerWithAuth();
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
      const defaults = {
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
      const task = {
        Name: config.name,
        version: parseInt(inspect.Version.Index, 10),
        TaskTemplate: {
          ContainerSpec: {
            Image: `${config.image}:${config.tag}`,
          },
          ForceUpdate: 1
        }
      };
      service.update(task, done);
    }
  }, (err, results) => {
    allDone(err);
  });
};
