var ProxySchema, Schema, mongoose;

mongoose = require('mongoose');

Schema = mongoose.Schema;

ProxySchema = new Schema({
  ip: String,
	port: String,
  server: String,
  createdAt: {
    type: Date,
    "default": Date.now
  }
});

mongoose.model('Proxy', ProxySchema);

module.exports.Proxy = mongoose.model('Proxy');

module.exports.ProxySchema = ProxySchema;
