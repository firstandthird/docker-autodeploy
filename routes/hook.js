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
        if (payload.environment && serviceTask.Spec.TaskTemplate.ContainerSpec.Env) {
          task.TaskTemplate.ContainerSpec.Env = serviceTask.Spec.TaskTemplate.ContainerSpec.Env.map(env => {
            const key = env.split('=')[0];
            if (payload.environment[key]) {
              return `${key}:${payload.environment[key]}`;
            }
            return env;
          });
        }
        const newTask = aug(serviceTask.Spec, task);
        if (settings.debug) {
          server.log(['hook', 'debug'], newTask);
        }
        done(null, newTask);
      },
      update(taskSpec, service, auth, done) {
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

