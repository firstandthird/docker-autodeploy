const async = require('async');
const Docker = require('dockerode');
module.exports = function(allDone) {
  const docker = new Docker();
  async.autoInject({
    services(done) {
      docker.listServices({
        label: 'autodeploy.stop'
      }, done);
    },
    filter(services, done) {
      const filtered = services.filter((s) => {
        const val = s.Spec.Labels['autodeploy.stop'];
        const num = parseInt(val, 10);
        const date = new Date(num);
        return (date < new Date().getTime());
      });
      done(null, filtered);
    },
    stop(filter, done) {
      async.map(filter, (s, next) => {
        const service = docker.getService(s.ID);
        service.remove((err) => next(err, s.Spec.Name));
      }, done);
    }
  }, (err, results) => allDone(err, results.stop));
};
