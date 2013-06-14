var google = require('google'),
async = require('async'),
Proxy = require('../model/proxy').Proxy,
request = require('request'),
colors = require('colors'),
exec = require('child_process').exec,
regex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/,
nextCounter = 0;
google.resultsPerPage = 25;
exports.actions = function(req,res,ss) {
  req.use('session');
  req.use('client.auth');
  return {
    check: function(status){
      var q = async.queue(function (proxy, callback) {
        console.log('Processing: '+proxy.ip+':'+proxy.port);
        exec('curl --proxy ' + proxy.ip + ':'+ proxy.port + ' http://checkip.dyndns.org/',{timeout:5000}, function(err, stdout, stderr) {
          if (stdout && regex.exec(stdout) && regex.exec(stdout).shift()==proxy.ip) {
            console.log(proxy.ip.green);
            proxy.status = 'alive';
            proxy.createdAt = Date.now();
            proxy.save(function(err){
              if (err) {
                ss.publish.all('error', 'Error when saving!');
              };
            });
          }
          else{
            console.log(proxy.ip.red);
            proxy.status = 'dead';
            proxy.createdAt = Date.now();
            proxy.checkTime += 1;
            proxy.save(function(err){
              if (err) {
                ss.publish.all('error', 'Error when saving!');
              };
            })
          }
          callback();
        });
      }, 100);
      q.drain = function() {
        ss.publish.all('proxy','All proxies have been processed');
      }
      Proxy.find({status:status})
      .sort('-createdAt')
      .exec(function(error, proxies){
        if (!error) {
          q.push(proxies, function(err){
            if (err) {
              ss.publish.all('error', 'Error when checking proxy!');
            };
          });
        };
      });
      return res('Proxy checking in progess!')
    }
  };
}