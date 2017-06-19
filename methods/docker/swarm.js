const async = require('async');
const Docker = require('dockerode');

module.exports = function(config, allDone) {
  const server = this;
  async.autoInject({
    docker(done) {
      const docker = new Docker();
      done(null, docker);
    },
    auth(done) {
      const auth = server.methods.docker.authConfig();
      done(null, auth);
    },
    task(auth, done) {
      const task = {
        auth,
        Name: config.Name,
        TaskTemplate: config.TaskTemplate
      };
      done(null, task);
    },
    service(task, docker, done) {
      const service = docker.getService(task.Name);
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
    start(docker, task, inspect, done) {
      if (inspect) {
        return done();
      }
      docker.createService(task, done);
    },
    update(docker, task, service, inspect, done) {
      if (!inspect) {
        return done();
      }
      task.version = parseInt(inspect.Version.Index, 10);
      task.TaskTemplate.ForceUpdate = 1;
      service.update(task, done);
    }
  }, (err, results) => {
    allDone(err);
  });
};
