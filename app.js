var http = require('http'),
ss = require('socketstream'),
mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ggcp');

// Connect database
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log('Database connect!')
});
// Define a single-page client
ss.client.define('main', {
	view: 'index.html',
	css:  ['plugins/jquery.jgrowl.css', 'style.less'],
  code: ['libs'
  , 'app'], //requires you to make a symlink from ../lib to libs
  tmpl: '*'
});

ss.session.options.maxAge = 2.6*Math.pow(10,9);

// Serve this client on the root URL
ss.http.route('/', function(req, res){
	res.serveClient('main');
});

// Code Formatters
ss.client.formatters.add(require('ss-less'));
ss.client.templateEngine.use('angular');

//responders
ss.responders.add(require('ss-angular'),{pollFreq: 1000});

// Minimize and pack assets if you type: SS_ENV=production node app.js
if (ss.env == 'production') ss.client.packAssets();

ss.session.store.use('redis');
ss.publish.transport.use('redis');

// Start web server
var server = http.Server(ss.http.middleware);
server.listen(3000);

// Start SocketStream
ss.start(server);
