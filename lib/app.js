'use strict';

require('dotenv').load();
var core = require('entipic.core');

core.Logger.init({
	tags: ['entipic.cdn'],
	json: true
});

if (process.env.MODE !== 'dev') {
	core.logger.warn('Starting app...', {
		maintenance: 'start'
	});
}

var express = require('express');
// var bodyParser = require('body-parser');
var responseTime = require('response-time');
// var Promise = core.Promise;
var routes = require('./routes');
var utils = require('./utils.js');
var path = require('path');
var startDate = new Date();
var app;


function catchError(req, res, error) {
	core.logger.error(error.message || 'errorHandler', {
		hostname: req.hostname,
		url: req.originalUrl,
		stack: error.stack
	});

	utils.maxage(res, 0);

	res.status(error.code || error.statusCode || 500).send('Error!');
}

function createApp() {
	app = express();

	app.disable('x-powered-by');
	app.disable('etag');

	//app.use(bodyParser.json()); // to support JSON-encoded bodies
	app.use(responseTime());
	if (process.env.MODE === 'dev') {
		app.use(require('morgan')('dev'));
	}

	app.use(express.static(path.join(__dirname, 'public'), {
		maxAge: process.env.MODE === 'dev' ? 0 : (1000 * 60 * 15)
	}));

	routes(app);

	app.all('*', function(req, res) {
		// core.logger.warn('404 Not Found', {
		//   hostname: req.hostname,
		//   url: req.originalUrl
		// });
		res.status(404).end();
	});

	app.use(function(error, req, res) {
		catchError(req, res, error);
	});

	app.on('uncaughtException', function(req, res, route, error) {
		catchError(req, res, error);
	});

	app.listen(process.env.PORT);
}

createApp();

process.on('uncaughtException', function(err) {
	core.logger.error('uncaughtException: ' + err.message, {
		trace: err.trace
	});
});


function testProcess() {
	var memory = parseInt(process.memoryUsage().rss / 1048576);
	var time = (Date.now() - startDate) / 1000 / 60;
	time = parseInt(time);
	var MEMORY = parseInt(process.env.MEMORY_LIMIT);
	if (memory > MEMORY) {
		core.logger.error('Memory overload', {
			memory: memory,
			runtime: time,
			maintenance: 'stop'
		});
		setTimeout(function() {
			return process.kill(process.pid);
		}, 1000 * 10);
	}
}

if (process.env.MODE !== 'dev') {
	setInterval(testProcess, 1000 * 60 * 5);
}
