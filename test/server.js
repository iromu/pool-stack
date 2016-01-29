/* global describe:true, before:true, after:true, it:true, global:true,
 baseURL:true, process:true */

'use strict';


process.env.NODE_ENV = 'test';
var config = require('config'),
    app = require('../app'),
    bunyan = require('bunyan'),
    PrettyStream = require('bunyan-prettystream'),
    request = require('supertest');

var server;

before(function (done) {

    var bunyanToConsole = new PrettyStream();
    bunyanToConsole.pipe(process.stdout);

    var logger = bunyan.createLogger({
        name: 'testLogger',
        streams: [{
            level: 'error',
            type: 'raw',
            stream: bunyanToConsole
        }]
    });

    server = app.createServer(logger);

    // start listening
    var port = config.get('server.port');
    server.listen(port, function () {
        logger.info('%s listening at %s', server.name, server.url);
    });

    server.on('NotFound', function (req, res, next) {
        if (logger) {
            logger.debug('404', 'No route that matches request for ' + req.url);
        }
        res.send(404, req.url + ' was not found');
        return next();
    });

    server.on('uncaughtException', function (req, res, route, err) {
        if (logger) {
            logger.error('Uncaught error', err);
        }
        res.send(500, 'Error');
    });

    global.baseURL = 'http://localhost:' + port;

    // make sure the server is started
    setTimeout(function () {
        request(baseURL)
            .get('/')
            .end(function (err, res) {
                if (err && err.code === 'ECONNREFUSED') {
                    return done(new Error('Server is not running.'));
                }
                return done(err);
            });
    }, 500);
});

after(function () {
    server.close();
});
