'use strict';

require('dotenv').load();
const logger = require('./logger');

if (process.env.MODE !== 'dev') {
	logger.warn('Starting app...', {
		maintenance: 'start'
	});
}

const express = require('express');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
// const methodOverride = require('method-override');
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
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	logger.error(error.message || 'errorHandler', {
		hostname: req.hostname,
		url: req.originalUrl,
		error: error,
		ip: ip,
		ref: req.get('Referrer')
	});

	utils.maxage(res, 5);

	var links = res.locals.links;
	var culture = res.locals.currentCulture;

	var statusCode = error.statusCode || error.code || 500;
	statusCode = statusCode < 200 ? 500 : statusCode;

	res.status(statusCode).end();
}

function createApp() {
	const app = express();

	app.disable('x-powered-by');
	app.disable('etag');

	// app.use(bodyParser.json()); // to support JSON-encoded bodies
	app.use(bodyParser.urlencoded());
	// app.use(cookieParser());
	// app.use(methodOverride());
	// app.use(responseTime());
	if (process.env.MODE === 'dev') {
		app.use(require('morgan')('dev'));
	}

	app.use(express.static(path.join(__dirname, 'public'), {
		maxAge: process.env.MODE === 'dev' ? 0 : (1000 * 60 * 15)
	}));

	routes(app);

	app.all('*', function(req, res) {
		var error = new Error('Page not found');
		error.statusCode = 404;
		catchError(req, res, error);
	});

	/*eslint no-unused-vars:1*/
	app.use(function(err, req, res, next) {
		catchError(req, res, err);
	});

	app.on('uncaughtException', function(req, res, route, error) {
		catchError(req, res, error);
	});

	app.listen(process.env.PORT);
}

createApp();

process.on('uncaughtException', function(err) {
	// console.trace(err);
	logger.error('uncaughtException: ' + err.message, err);
});

process.on('unhandledRejection', function(error) {
	logger.error('unhandledRejection: ' + error.message, error);
});
