//des describes the model and has the middleware
//chan is a channel on which to post the updated model object
var Site = require('./site').Site;
var async = require('async');
exports.make = function(des,chan,ss) {
  des.use('session')
  des.use('client.auth');
  return {
    //must have a poll function for now. may have other update models
    poll: function(p) {
      Site.find(function(error,sites){
        if(!error){
          chan(sites);
        } else {
          ss.publish.all('danger','Site List', 'Error when getting data!');
        }
      });
    }
  };
};