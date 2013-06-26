var SiteSchema, Schema, mongoose;

mongoose = require('mongoose');

Schema = mongoose.Schema;

SiteSchema = new Schema({
  name: String,
	url: String,
  pageParam: String,
  maxPage: Number,
  pageSuffix: String,
  useSpliter: Boolean,
  spliter: String,
  rowSelector: String,
  ipSelector: String,
  portSelector: String,
  lastRun: Date,
  isRunning: {
    type: Boolean,
    "default": false
  },
  createdAt: {
    type: Date,
    "default": Date.now
  }
});

mongoose.model('Site', SiteSchema);

module.exports.Site = mongoose.model('Site');

module.exports.SiteSchema = SiteSchema;