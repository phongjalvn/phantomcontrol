var GoogleLinkSchema, Schema, mongoose;

mongoose = require('mongoose');

Schema = mongoose.Schema;

GoogleLinkSchema = new Schema({
  title: String,
  link: String,
  description: String,
  createdAt: {
    type: Date,
    "default": Date.now
  }
});

mongoose.model('GoogleLink', GoogleLinkSchema);

module.exports.GoogleLink = mongoose.model('GoogleLink');

module.exports.GoogleLinkSchema = GoogleLinkSchema;
