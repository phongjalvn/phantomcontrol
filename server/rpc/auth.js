exports.actions = function(req,res,ss) {
	var User;
  req.use('session');
  User = require('../model/user').User;
	return {
		authenticate: function(username,password) {
			if (username && password) {
        return User.findOne({
          userId: username
        }, function(error, user) {
          if (error == null) {
            if (user != null && passwordHash.verify(password, user.password)) {
              req.session.setUserId(user.userId);
              return res(true);
            } else {
              return res(false);
            }
          } else {
            return res(false);
          }
        });
      } else {
        return res(false);
      }
		},
		authenticated: function() {
			if(req.session.userId) {
				res(true);
			}
			else {
				res(false);
			}
		},
		logout: function() {
			req.session.setUserId(null);
			res(true);
		}
	}
}