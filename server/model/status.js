//des describes the model and has the middleware
//chan is a channel on which to post the updated model object
exports.make = function(des,chan,ss) {
  des.use('session')
  des.use('client.auth');
  
  return {
    //must have a poll function for now. may have other update models
    poll: function(p) {
      var d = new Date();
      var status = {
        arch: process.arch,
        platform: process.platform,
        version: process.version,
        numberprocessor: process.NUMBER_OF_PROCESSORS,
        path: process.PATH,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        servertime: d
      };
      chan(status);
    }
  };
};