// This file automatically gets called first by SocketStream and must always exist

// Make 'ss' available to all modules and the browser console
window.ss = require('socketstream');

ss.server.on('disconnect', function () {
    console.log('Connection down :-(');
});

ss.server.on('reconnect', function () {
    console.log('Connection back up :-)');
});

require('ssAngular');
require('/controllers');
ss.server.on('ready', function () {

    jQuery(function () {

        require('/app');

    });

});
