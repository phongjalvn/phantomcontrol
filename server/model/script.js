var ScriptSchema, Schema, mongoose;

mongoose = require('mongoose');

Schema = mongoose.Schema;

ScriptSchema = new Schema({
  name: String,
	args: Array,
  isRunning: Boolean,
  parallel: Number,
  log: Array,
  createdAt: {
    type: Date,
    "default": Date.now
  }
});

mongoose.model('Script', ScriptSchema);

module.exports.Script = mongoose.model('Script');

module.exports.ScriptSchema = ScriptSchema;
