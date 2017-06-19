const async = require('async');
const Docker = require('dockerode');
const aug = require('aug');

module.exports = function(baseConfig, allDone) {
  const server = this;
  async.autoInject({
    docker(done) {
      const docker = new Docker();
      done(null, docker);
    },
    taskConfig(done) {
      const auth = server.methods.docker.authConfig();
      const defaults = {
        authconfig: auth,
        Name: baseConfig.name,
        TaskTemplate: {
          ContainerSpec: {
            Image: `${baseConfig.image}:${baseConfig.tag}`
          }
        }
      };
      const task = aug(true, {}, defaults, baseConfig.serviceConfig || {});
      done(null, task);
    },
    service(taskConfig, docker, done) {
      const service = docker.getService(taskConfig.Name);
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
    start(taskConfig, docker, inspect, done) {
      if (inspect) {
        return done();
      }
      docker.createService(taskConfig, done);
    },
    update(docker, service, taskConfig, inspect, done) {
      if (!inspect) {
        return done();
      }
      taskConfig.version = parseInt(inspect.Version.Index, 10);
      taskConfig.TaskTemplate.ForceUpdate = 1;
      service.update(taskConfig, done);
    }
  }, (err, results) => {
    allDone(err);
  });
};
