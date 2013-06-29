exports.actions = function (req, res, ss) {
    var User = require('../model/user').User,
        passwordHash = require('password-hash');
    req.use('session');
    req.use('client.auth');
    return {
        getCurrentUser: function () {
            if (req.session.userId) {
                return res(req.session.userId);
            }
            ss.publish.all('message', 'danger', 'User Manager', 'Error when getting current user');
            return res(false);
        },
        getName: function (userId) {
            var uid = userId || req.session.userId;
            if (uid) {
                User.findOne({
                    userId: uid
                }, function (error, user) {
                    if (error == null) {
                        if (user != null) {
                            res(user.displayname);
                        } else {
                            ss.publish.all('message', 'danger', 'User Manager', 'Error when getting displayname');
                            res(false);
                        }
                    }
                });
            }
        },
        createUser: function (username, password, password2, displayname) {
            if ((req.session != null) && (req.session.userId != null)) {
                if (username && password && password2 && displayname && password == password2) {
                    User.findOne({
                        userId: username
                    }, function (error, user) {
                        if (error == null) {
                            if (user == null) {
                                var newuser = new User();
                                newuser.userId = username;
                                newuser.password = passwordHash.generate(password);
                                newuser.displayname = displayname;
                                newuser.save(function (error) {
                                    if (error == null) {
                                        ss.publish.all('message', 'success', 'User Manager', 'Created user');
                                        res(true);
                                    }
                                });
                            } else {
                                ss.publish.all('message', 'danger', 'User Manager', 'User already exist!');
                                res(false);
                            }
                        }
                    });
                }
            }
            ss.publish.all('message', 'danger', 'User Manager', 'Error when create user');
            res(false);
        },
        updateUser: function (username, password, password2, displayname) {
            if ((req.session != null) && (req.session.userId != null)) {
                // username is only required
                if (username) {
                    User.findOne({
                        userId: username
                    }, function (error, user) {
                        if (error == null) {
                            if (user != null) {
                                // Update displayname
                                if (displayname) {
                                    user.displayname = displayname;
                                }
                                // Update password
                                if (password && password == password2) {
                                    user.password = passwordHash.generate(password);
                                }

                                // Save it
                                user.save(function (error) {
                                    if (error == null) {
                                        ss.publish.all('message', 'success', 'User Manager', 'Updated user');
                                        res(true);
                                    }
                                });
                            }
                        }
                    });
                }
            }
            ss.publish.all('danger', 'User Manager', 'Error when update user');
            res(false);
        },
        deleteUser: function (userId) {
            User.findOneAndRemove({userId: userId}, function (error) {
                if (!error) {
                    ss.publish.all('message', 'success', 'User Manager', 'Deleted user');
                    res('Deleted user');
                }
                ss.publish.all('message', 'danger', 'User Manager', 'Error when delete user');
                res(false);
            });
        }
    }
};