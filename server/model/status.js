//des describes the model and has the middleware
//chan is a channel on which to post the updated model object
var User = require('./user').User;
var Proxy = require('./proxy').Proxy;
var async = require('async');
exports.make = function(des,chan,ss) {
  des.use('session')
  des.use('client.auth');
  return {
    //must have a poll function for now. may have other update models
    poll: function(p) {
      var d = new Date(), status;
      async.parallel({
        totalUsers: function(callback){
          User.count(function(error, count){
            if (error) {
              callback(error);
            };
            callback(null,count);
          })
        },
        totalProxies: function(callback){
          Proxy.count(function(error, count){
            if (error) {
              callback(error);
            };
            callback(null,count);
          })
        },
        aliveProxies: function(callback){
          Proxy.count({status:'alive'},function(error, count){
            if (error) {
              callback(error);
            };
            callback(null,count);
          })
        },
        deadProxies: function(callback){
          Proxy.count({status:'dead'},function(error, count){
            if (error) {
              callback(error);
            };
            callback(null,count);
          })
        }
      },
      function(err, results) {
        if (err) return ss.publish.all('danger','Server status update', 'Error when getting data!');
        status = {
          arch: process.arch,
          platform: process.platform,
          version: process.version,
          path: process.PATH,
          memory: process.memoryUsage(),
          uptime: Math.round(process.uptime()),
          servertime: d,
          totalUsers: results.totalUsers,
          totalProxies: results.totalProxies,
          aliveProxies: results.aliveProxies,
          deadProxies: results.deadProxies
        };
        chan(status);
      });
    }
  };
};