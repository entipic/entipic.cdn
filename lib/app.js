'use strict';

require('dotenv').load();
const logger = require('./logger');

if (process.env.MODE !== 'dev') {
	logger.warn('Starting app...', {
		maintenance: 'start'
	});
}

const express = require('express');
// var bodyParser = require('body-parser');
// const responseTime = require('response-time');
// var Promise = core.Promise;
const routes = require('./routes');
const utils = require('./utils');
const Data = require('./data');
const path = require('path');

function exit(error) {
	if (error) {
		logger.error('Exit with error: ' + error.message, error);
	}
	Data.close(function() {
		// console.log('Mongoose connection disconnected through app termination');
		/*eslint no-process-exit:0*/
		process.exit(0);
	});
}


function catchError(req, res, error) {
	logger.error(error.message || 'errorHandler', {
		hostname: req.hostname,
		url: req.originalUrl,
		stack: error.stack
	});

	utils.maxage(res, 0);

	res.status(error.code || error.statusCode || 500).send('Error!');
}

function createApp() {
	const app = express();

	app.disable('x-powered-by');
	app.disable('etag');

	//app.use(bodyParser.json()); // to support JSON-encoded bodies
	// app.use(responseTime());
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

process.on('uncaughtException', exit);

process.on('SIGINT', exit);

process.on('message', function(msg) {
	if (msg === 'shutdown') {
		logger.warn('Exit with shutdown message!');
		exit();
	}
});
