const async = require('async');
const Docker = require('dockerode');

module.exports = function(config, allDone) {
  const server = this;
  const debug = server.settings.app.debug;
  async.autoInject({
    docker(done) {
      const docker = new Docker();
      done(null, docker);
    },
    auth(done) {
      const auth = server.methods.docker.authConfig();
      done(null, auth);
    },
    task(done) {
      if (debug) {
        server.log(['swarm', 'task', 'debug'], config);
      }
      done(null, config);
    },
    service(task, docker, done) {
      const service = docker.getService(task.Name);
      done(null, service);
    },
    pull(auth, task, docker, done) {
      const image = task.TaskTemplate.ContainerSpec.Image;
      docker.pull(image, { authconfig: auth }, (err, stream) => {
        if (err) {
          return done(err);
        }
        docker.modem.followProgress(stream, done);
        if (debug) {
          server.log(['swarm', 'pull', 'debug'], image);
        }
      });
    },
    inspect(pull, service, done) {
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
    start(auth, docker, task, inspect, done) {
      if (inspect) {
        return done();
      }
      if (debug) {
        server.log(['swarm', 'create', 'debug'], { create: task });
      }
      docker.createService(auth, task, done);
    },
    update(auth, docker, task, service, inspect, done) {
      if (!inspect) {
        return done();
      }
      task.version = parseInt(inspect.Version.Index, 10);
      task.TaskTemplate.ForceUpdate = 1;
      if (debug) {
        server.log(['swarm', 'update', 'debug'], { update: task });
      }
      service.update(auth, task, done);
    }
  }, (err, results) => {
    allDone(err);
  });
};
