exports.actions = function(req,res,ss) {
	var User;
  req.use('session');
  req.use('client.auth');
  User = require('../model/user').User;
	return {
    getCurrentUser: function(){
      if(req.session.userId) {
        return res(req.session.userId);
      }
      ss.publish.all('message','danger','User Manager', 'Error when getting current user');
      return res(false);
    },
    getName: function(userId){
      var uid = userId || req.session.userId;
      if(uid) {
        User.findOne({
          userId:uid
        },function(error,user){
          if (error == null) {
            if (user != null) {
              return res(user.displayname);
            } else {
              ss.publish.all('message','danger','User Manager', 'Error when getting displayname');
              return res(false);
            }
          }
        });
      }
    },
    createUser: function(username, password, password2, displayname) {
      if ((req.session != null) && (req.session.userId != null)) {
        if (username && password && password2 && displayname && password==password2) {
          return User.findOne({
            userId: username
          }, function(error, user) {
            if (error == null) {
              if (user == null) {
                var newuser = new User();
                newuser.userId = username;
                newuser.password = password;
                newuser.displayname = displayname;
                return newuser.save(function(error) {
                  if (error == null) {
                    ss.publish.all('message','success','User Manager', 'Created user');
                    return res(true);
                  }
                });
              } else {
                ss.publish.all('message','danger','User Manager', 'User already exist!');
                return res(false);
              }
            }
          });
        }
      }
      ss.publish.all('message','danger','User Manager', 'Error when create user');
      return res(false);
    },
    updateUser: function(username, password, password2, displayname) {
      if ((req.session != null) && (req.session.userId != null)) {
        // username is only required
        if (username) {
          return User.findOne({
            userId: username
          }, function(error, user) {
            var _this = this;
            if (error == null) {
              if (user != null) {
                // Update displayname
                if (displayname) {
                  user.displayname = displayname;
                };
                // Update password
                if (password && password == password2) {
                  user.password = password;
                };
                
                // Save it
                return user.save(function(error) {
                  if (error == null) {
                    ss.publish.all('message','success','User Manager', 'Updated user');
                    return res(true);
                  }
                });
              }
            }
          });
        }
      }
      ss.publish.all('danger','User Manager', 'Error when update user');
      return res(false);
    },
    deleteUser: function(userId){
      User.findOneAndRemove({userId: userId}, function(error){
        if (!error) {
          ss.publish.all('message','success','User Manager', 'Deleted user');
          return res('Deleted user');
        }
        ss.publish.all('message','danger','User Manager', 'Error when delete user');
        return res(false);
      });
    }
	}
}