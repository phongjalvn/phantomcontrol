var async = require('async'),
colors = require('colors'),
exec = require('child_process').exec,
phantom=require('node-phantom-ws');

exports.actions = function(req,res,ss) {
	var Site = require('../model/site').Site,
  Proxy = require('../model/proxy').Proxy;
  req.use('session');
  req.use('client.auth');
  return {
    get: function(name){
      Site.findOne({
        name: name
      }, function(error, site){
        if (error == null&&site!=null) {
          return res(site);
        }
      });
    },
    create: function(siteSubmit) {
      console.log(siteSubmit);
      if (siteSubmit.name, siteSubmit.url, siteSubmit.pageParam) {
        return Site.findOne({
          name: siteSubmit.name
        }, function(error, site) {
          if (error == null) {
            if (site == null) {
              var newsite = new Site({
                name: siteSubmit.name,
                url: siteSubmit.url,
                pageParam: siteSubmit.pageParam,
                maxPage: siteSubmit.maxPage,
                pageSuffix: siteSubmit.pageSuffix
              });
              newsite.save(function(error) {
                if (error == null) {
                  ss.publish.all('message','success','Site Manager', 'Created site');
                  return res(true);
                }
              });
            } else {
              ss.publish.all('message','danger','Site Manager', 'Site already exist!');
              return res(false);
            }
          }
        });
      }
      ss.publish.all('message','danger','Site Manager', 'Error when create site');
      return res(false);
    },
    update: function(sitename,siteSubmit) {
      if (sitename&&siteSubmit) {
        return Site.findOne({
          name: sitename
        }, function(error, site) {
          var _this = this;
          if (error == null) {
            if (site != null) {
              site.name= siteSubmit.name;
              site.url= siteSubmit.url;
              site.pageParam= siteSubmit.pageParam;
              site.maxPage= siteSubmit.maxPage;
              pageSuffix: siteSubmit.pageSuffix;
                // Save it
                site.save(function(error) {
                  if (error == null) {
                    ss.publish.all('message','success','Site Manager', 'Updated site');
                    return res(true);
                  }
                });
              }
            }
          });
      }
      ss.publish.all('danger','Site Manager', 'Error when update site');
      return res(false);
    },
    delete: function(name){
      Site.findOneAndRemove({name: name}, function(error){
        if (!error) {
          ss.publish.all('message','success','Site Manager', 'Deleted site');
          return res('Deleted site');
        }
        ss.publish.all('message','danger','Site Manager', 'Error when delete site');
        return res(false);
      });
    },
    run: function(name){
      var currentSite;

      // Get Proxy from a page
      var getProxyQueue = async.queue(function (siteurl, callback) {
        console.log('Processing: '+siteurl);
        phantom.create(function(err,ph) {
          ph.createPage(function(err,page) {
            // page.set('settings',{'userAgent':'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36'}, function(err){
            //   if (!err) {

            //   };
            // });
            page.open(siteurl, function(err,status){
              console.log("opened site? ", status);
              // Super Phantom Hero appear
              page.evaluate(function(){
                // This scope only run on Phantom
                var bodyText = document.querySelectorAll('body')[0].innerText,
                proxyRegex = /(\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b)([\t|\s|:]+)(\d{2,5})/g,
                matches = bodyText.match(proxyRegex);
                return matches;
              }, function(err,result){
                if (!err && result) {
                  var proxyRegex = /(\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b)([\t|\s|:]+)(\d{2,5})/g;
                  for (var i = result.length - 1; i >= 0; i--) {
                    var proxy = proxyRegex.exec(result[i]);
                    if (proxy) {
                      checkProxyQueue.push({'ip':proxy[1],'port':proxy[3]});
                    };
                  };
                };
                callback();
                ph.exit();
              });
            });
          });
        });
      }, 5);
      // Finish scrape all pages
      getProxyQueue.drain = function() {
        ss.publish.all('message','success','Site Manager', 'Site scraper run successfully, checking proxy!');
      }

      // Check Proxy Queue
      var checkProxyQueue = async.queue(function (proxy, callback) {
        console.log('Processing: '+proxy.ip+':'+proxy.port);
        var ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
        exec('curl --proxy ' + proxy.ip + ':'+ proxy.port + ' http://checkip.dyndns.org/',{timeout:5000}, function(err, stdout, stderr) {
          if (stdout && ipRegex.exec(stdout) && ipRegex.exec(stdout).shift()==proxy.ip) {
            console.log(proxy.ip.green);
            // Check If Proxy exist, if not, save it
            Proxy.findOne({ip:proxy.ip})
            .exec(function(error, oldproxy){
              if (!error&&!oldproxy) {
                var newproxy = new Proxy({
                  ip: proxy.ip,
                  port: proxy.port,
                  server: currentSite.name
                });
                newproxy.save();
              };
            });
          } else {
            console.log(proxy.ip.red);
          }
          callback();
        });
      }, 50);
      checkProxyQueue.drain = function() {
        currentSite.isRunning = false;
        currentSite.save();
        ss.publish.all('message','success','Site Manager', 'Proxy checking done, all proxy saved.');
      }

      async.waterfall([
        // Check if any site is running
        function(callback){
          Site.findOne({isRunning:true},function(error,site){
            callback(error, site);
          });
        },
        // Get site from database
        function(isRunning,callback){
          if (isRunning) {
            // Debug only
            isRunning.isRunning = false;
            isRunning.save();
            ss.publish.all('message','danger','Site Manager', 'Scraper is running');
            return res(false);
          };
          Site.findOne({name:name},function(error,site){
            callback(error, site);
          });
        },
        // Update lastRun
        function(site, callback){
          site.lastRun = Date.now();
          site.isRunning = true;
          site.save(function(error, site){
            callback(error, site);
          });
        }
      ],
      function (error, site) {
        if (!error) {
          currentSite = site;
          for (var i = 0; i < site.maxPage; i++) {
            getProxyQueue.push(site.url+site.pageParam+i+site.pageSuffix);
          };
          ss.publish.all('message','success','Site Manager', 'Site scraper started');
        } else {
          ss.publish.all('message','danger','Site Manager', 'Error when start site scraper');
        };
      });
      return res(true);
    }
  };
};
