'use strict';
var Itach;
var net = require('net');

var next = function (cmd, cb) {
    cmd.shift();
    if (typeof cmd[0] === 'number') {
        return setTimeout(function () { return next(cmd, cb); }, cmd[0]);
    }
    return cb(cmd);
};

module.exports = Itach = function (host, port) {
    this.host = host;
    this.port = port;
};

Itach.prototype.send = function (command, callback) {
    var err;
    var res = [];
    var socket = new net.Socket();

    if (!this.host) {
        return callback(new Error('No host'));
    }

    if (!Array.isArray(command)) {
        command = [command];
    }

    if (typeof command[0] === 'number') {
        return callback(new Error('First element has to be a command (string)'));
    }

    socket.setEncoding('ASCII');
    socket.connect(this.port, this.host);
    socket.on('data', function (chunk) {
        res.push(chunk);
        next(command, function (cmd) {
            command = cmd;
            if (command.length !== 0 && command[0]) {
                socket.write(command[0], 'ASCII');
            } else {
                socket.end();
            }
        });
    });
    socket.on('error', function (error) {
        err = error; // error with connection, closes socket
    });
    socket.on('close', function () {
        if (err) {
            return callback(err);
        }
        return callback(null, res);
    });

    // write first command
    socket.write(command[0], 'ASCII');

};