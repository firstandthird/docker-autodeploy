'use strict';
const Joi = require('joi');
const Boom = require('boom');
const Docker = require('dockerode');
const aug = require('aug');
exports.hook = {
  path: '/',
  method: 'POST',
  config: {
    validate: {
      query: {
        secret: Joi.string()
      },
      payload: {
        name: Joi.string(),
        image: Joi.string(),
        environment: Joi.object(),
        labels: Joi.object()
      }
    }
  },
  handler: {
    autoInject: {
      secret(settings, request, done) {
        const secret = settings.secret;
        if (secret !== request.query.secret) {
          return done(Boom.unauthorized());
        }
        done(null, secret);
      },
      docker(done) {
        const docker = new Docker();
        done(null, docker);
      },
      auth(server, done) {
        const auth = server.methods.docker.authConfig();
        done(null, auth);
      },
      payload(request, done) {
        done(null, request.payload);
      },
      service(docker, payload, done) {
        const service = docker.getService(payload.name);
        done(null, service);
      },
      serviceTask(service, done) {
        service.inspect(done);
      },
      taskSpec(settings, server, serviceTask, payload, done) {
        const task = {
          version: parseInt(serviceTask.Version.Index, 10),
          TaskTemplate: {
            ContainerSpec: {},
            ForceUpdate: 1,
          }
        };
        if (payload.image) {
          task.TaskTemplate.ContainerSpec.Image = payload.image;
        }
        if (payload.labels) {
          task.Labels = payload.labels;
        }
        let specEnv = {};
        if (serviceTask.Spec.TaskTemplate.ContainerSpec.Env) {
          specEnv = server.methods.arrToObj(serviceTask.Spec.TaskTemplate.ContainerSpec.Env);
        }

        if (payload.environment) {
          specEnv = Object.assign({}, specEnv, payload.environment);
        }

        specEnv['UPDATED'] = new Date().getTime();

        serviceTask.Spec.TaskTemplate.ContainerSpec.Env = server.methods.objToArr(specEnv);

        const newTask = aug(serviceTask.Spec, task);
        if (settings.debug) {
          server.log(['hook', 'debug'], newTask);
        }
        done(null, newTask);
      },
      pull(auth, payload, server, settings, docker, done) {
        if (!payload.image) {
          return done();
        }
        const image = payload.image;
        docker.pull(image, { authconfig: auth }, (err, stream) => {
          if (err) {
            return done(err);
          }
          docker.modem.followProgress(stream, done);
          if (settings.debug) {
            server.log(['swarm', 'pull', 'debug'], image);
          }
        });
      },
      update(pull, taskSpec, service, auth, done) {
        service.update(auth, taskSpec, done);
      },
      reply(server, update, payload, done) {
        let message = `Updating ${payload.name}`;
        if (payload.domain) {
          message += ` at ${payload.domain}`;
        }
        server.log(['deploy', 'success'], message);
        done(null, 'ok');
      }
    }
  }
};

