//des describes the model and has the middleware
//chan is a channel on which to post the updated model object
var User = require('./user').User;
var async = require('async');
exports.make = function(des,chan,ss) {
  des.use('session')
  des.use('client.auth');
  return {
    //must have a poll function for now. may have other update models
    poll: function(p) {
      User.find(function(error,users){
        if(!error){
          chan(users);
        } else {
          ss.publish.all('danger','Server status update', 'Error when getting data!');
        }
      })
    }
  };
};