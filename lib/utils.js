'use strict';

exports._ = require('lodash');

const NO_CACHE = 'private, max-age=0, no-cache';
const PUBLIC_CACHE = 'public, max-age=';
const CACHE_CONTROL = 'cache-control';

const EMPTY_IMAGE = exports.EMPTY_IMAGE = new Buffer([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 1, 3, 0, 0, 0, 37, 219, 86, 202, 0, 0, 0, 3, 80, 76, 84, 69, 0, 0, 0, 167, 122, 61, 218, 0, 0, 0, 1, 116, 82, 78, 83, 0, 64, 230, 216, 102, 0, 0, 0, 10, 73, 68, 65, 84, 8, 215, 99, 96, 0, 0, 0, 2, 0, 1, 226, 33, 188, 51, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

exports.sendEmptyImage = function(res) {
	res.set({
		'content-type': 'image/png',
		'content-length': EMPTY_IMAGE.length
	});

	res.send(EMPTY_IMAGE);
};

/**
 * Set response Cache-Control
 * @maxage integet in minutes
 */
exports.maxage = function(res, maxage) {
	//maxage = 0;
	var cache = NO_CACHE;
	if (maxage > 0) {
		maxage = maxage * 60;
		cache = PUBLIC_CACHE + maxage;
		res.set('expires', new Date(Date.now() + (maxage * 1000)).toUTCString());
	}
	res.set(CACHE_CONTROL, cache);
};

exports.maxageNoPicture = function(res) {
	exports.maxage(res, 30);
};

exports.maxagePicture = function(res) {
	exports.maxage(res, 60 * 24 * 10);
};

exports.maxageIdPicture = function(res) {
	exports.maxage(res, 60 * 24 * 30);
};

exports.maxageRedirect = function(res) {
	exports.maxage(res, 60 * 12);
};

exports.maxageIndex = function(res) {
	exports.maxage(res, 10);
};

exports.maxageSearch = function(res) {
	exports.maxage(res, 60 * 2);
};
