var async = require('async'),
colors = require('colors'),
exec = require('child_process').exec,
phantom=require('node-phantom-ws');

exports.actions = function(req,res,ss) {
	var Site = require('../model/site').Site,
  Proxy = require('../model/proxy').Proxy;
  req.use('session');
  req.use('client.auth');
  // Private functions
  var checkAliveProxy = function(proxy, callback){
    var ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
    exec('curl --proxy ' + proxy.ip + ':'+ proxy.port + ' http://checkip.dyndns.org/',{timeout:5000}, function(err, stdout, stderr) {
      if (stdout && ipRegex.exec(stdout) && ipRegex.exec(stdout).shift()==proxy.ip) {
        callback(null,proxy);
      } else {
        callback('Dead Proxy',proxy);
      }
    });
  };
  var randomProxy = function(proxies, callback){
    var proxy = proxies[Math.floor(Math.random() * proxies.length)];
    checkAliveProxy(proxy, function(error, reproxy){
      if (!error) {
        callback(reproxy);
      } else {
        randomProxy(proxies, callback);
      };
    });
  };
  var phantomRunner = function(siteurl, params, callback){
    phantom.create(function(err,ph) {
      ph.createPage(function(err,page) {
        // page.set('settings',{'userAgent':'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36'}, function(err){
        //   if (!err) {
        //   };
        // });
        page.open(siteurl, function(err,status){
          console.log("opened site? ", status);
          // If fail, add it to the queue again
          if (status=='fail') {
            getProxyQueue.push(siteurl);
          };
          // Super Phantom Hero appear
          page.evaluate(function(){
            // This scope only run on Phantom
            var bodyText = document.querySelectorAll('body')[0].innerText,
            proxyRegex = /(\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b)([\t|\s|:]+)(\d{2,5})/g,
            matches = bodyText.match(proxyRegex);
            return matches;
          }, function(err,result){
            if (isTest) {
              console.log(result);
            } else {
              if (!err && result) {
                console.log('Got '+result.length+' proxies from '+siteurl);
                var proxyRegex = /(\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b)([\t|\s|:]+)(\d{2,5})/g;
                for (var i = result.length - 1; i >= 0; i--) {
                  var proxy = proxyRegex.exec(result[i]);
                  if (proxy) {
                    checkProxyQueue.push({'ip':proxy[1],'port':proxy[3]});
                  };
                };
              };
            }
            callback();
            ph.exit();
          });
          // End page.evaluate
        });
        // End page.open
      });
      // End createPage
    }, {parameters:params});
    // End phantom.create
  };
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
                pageSuffix: siteSubmit.pageSuffix,
                useProxy: siteSubmit.useProxy
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
              site.pageSuffix= siteSubmit.pageSuffix;
              site.useProxy= siteSubmit.useProxy;
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
    run: function(name, isTest){
      var currentSite,
      allProxies = [], processedPage = 0;

      // Get Proxy from a page
      var getProxyQueue = async.queue(function (siteurl, callback) {
        var useProxy, proxyConfig, params;
        if (allProxies.length) {
          randomProxy(allProxies, function(useProxy){
            proxyConfig = useProxy.ip+':'+useProxy.port;
            params = {
              'proxy': proxyConfig
            }
            console.log('Processing: '+siteurl+' through proxy: '+proxyConfig);
            processedPage++;
            phantomRunner(siteurl, params, callback);
          });
        } else {
          console.log('Processing: '+siteurl);
          processedPage++;
          phantomRunner(siteurl, params, callback);
        };
        
        
      }, 5);
      // Finish scrape all pages
      getProxyQueue.drain = function() {
        if (processedPage > currentSite.maxPage) {
          ss.publish.all('message','success','Site Manager', 'Site scraper run successfully, checking proxy!');
          if (isTest) {
            currentSite.isRunning = false;
            currentSite.save();
          };
        } else {
          ss.publish.all('message','success','Site Manager', 'Page Drain!');
        };
      }

      // Check Proxy Queue
      var checkProxyQueue = async.queue(function (proxy, callback) {
        // console.log('Processing: '+proxy.ip+':'+proxy.port);
        checkAliveProxy(proxy, function(error,proxy){
          if (!error) {
            console.log('Alive proxy: '+proxy.ip.green);
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
          };
          callback();
        });
      }, 50);
      checkProxyQueue.drain = function() {
        if (processedPage > currentSite.maxPage) {
          currentSite.isRunning = false;
          currentSite.save();
          ss.publish.all('message','success','Site Manager', 'Proxy checking done, all proxy saved.');
        } else {
          ss.publish.all('message','success','Site Manager', 'Proxies Drain!');
        };
      }

      async.waterfall([
        // Check if current site is running
        function(callback){
          Site.findOne({name:name, isRunning:true},function(error,site){
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
        // Get all proxies
        function(site,callback){
          if (site.useProxy) {
            Proxy.find(function(error,proxies){
              allProxies = proxies;
              callback(error,site);
            });
          } else {
            callback(null,site);
          };
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
          for (var i = 0; i <= site.maxPage; i++) {
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
