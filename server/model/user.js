var Schema, UserSchema, mongoose;

mongoose = require('mongoose');

Schema = mongoose.Schema;

UserSchema = new Schema({
  userId: String,
  password: String,
  displayname: String,
  createdAt: {
    type: Date,
    "default": Date.now
  }
});

mongoose.model('User', UserSchema);

module.exports.User = mongoose.model('User');

module.exports.UserSchema = UserSchema;