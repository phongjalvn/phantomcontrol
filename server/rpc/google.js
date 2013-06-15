// var google = require('google'),
// async = require('async'),
// GoogleLink = require('../model/googlelink').GoogleLink,
// Proxy = require('../model/proxy').Proxy,
// request = require('request'),
// nextCounter = 0;
// google.resultsPerPage = 25;
// exports.actions = function(req,res,ss) {
//   req.use('session');
//   req.use('client.auth');
//   var saveLink = function(tlink,callback){
//     GoogleLink.findOne({title:tlink.title},function(err, link){
//       if (err==null){
//         if (link==null) {
//           var googlelink = new GoogleLink();
//           googlelink.title = tlink.title;
//           googlelink.description = tlink.description;
//           googlelink.link = tlink.link;
//           googlelink.save(function(err){
//             if (err) {
//               ss.publish.all('error', 'Error when saving!');
//             };
//           });
//         };
//       } else {
//         ss.publish.all('error', 'Error when saving!');
//       }
//       callback();
//     });
//   }
//   var saveProxy = function(proxy){
//     var ip = proxy.split(':')[0],
//         port = proxy.split(':')[1];
//     Proxy.findOne({ip:ip},function(err, proxy){
//       if (err==null) {
//         if (proxy==null) {
//           var proxy = new Proxy();
//           proxy.ip = ip;
//           proxy.port = port;
//           proxy.server = 'google';
//           proxy.status = 'unchecked';
//           proxy.checkedTime = 0;
//           proxy.save(function(err){
//             if (err) {
//               ss.publish.all('error', 'Error when saving!');
//             };
//           });
//         }
//       } else {
//         ss.publish.all('error', 'Error when saving!');
//       }
//     });
//   }
//   return {
//     on: function() {
//       google('+:8080 +:80 +:3128 filetype:txt', function(err, next, links){
//         if (err||links==null) return ss.publish.all('error', 'Google Scraper Engine error!');
//         return async.each(links,saveLink, function(){
//           if (nextCounter < 10) {
//             nextCounter += 1;
//             if (next) next();
//             ss.publish.all('googleEngine', 'Page process finish, next page!');
//           } else {
//             ss.publish.all('googleEngine', 'Google Scraper Engine cycle finished!');
//             nextCounter = 0;
//           }
//         });
//       });
//       res("Start Scraper Engine");
//     },
//     getproxy: function(){
//       GoogleLink.find(function(error, links){
//         if (error&&links==null) {
//           ss.publish.all('error', 'Error getting page links!');
//         };
//         var regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b:\d{2,5}/g;
//         for (var i = 0; i < links.length; i++) {
//           ss.publish.all('googleEngine', 'Process page: '+links[i].link);
//           request(links[i].link, function (error, response, body) {
//             if (!error && response.statusCode == 200) {
//               var proxies = body.match(regex);
//               if (proxies){
//                 for (var i = 0; i < proxies.length; i++) {
//                   saveProxy(proxies[i]);
//                 };
//               };
//             }
//           });
//         };
//         ss.publish.all('googleEngine', 'Get Proxy finished!');
//       });
//     }
//   };
// }