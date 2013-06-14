//des describes the model and has the middleware
//chan is a channel on which to post the updated model object

var GoogleLink = require('./googlelink').GoogleLink;
exports.make = function(des,chan,ss) {
  des.use('session')
  des.use('client.auth');
  
  return {
    //must have a poll function for now. may have other update models
    poll: function(p) {
      GoogleLink.find()
      .sort('-createdAt')
      .limit(5)
      .exec(function(error, googlelinks){
        if (!error) {
          chan(googlelinks);
        };
      });
    }
  };
};