'use strict';

var express = require('express');
var core = require('entipic.core');
var _ = core._;
/*eslint new-cap:0*/
var route = module.exports = express.Router();
var utils = require('../utils.js');
var Data = require('../data.js');
var url = require('url');
var config = require('../config');
var Text = require('entipic.text');
var request = require('request');


function sendS3Picture(res, next, id, size) {
	utils.maxagePicture(res);
	size = size || 'a';
	var path = ['/images', size];
	path.push(id + '.jpg');
	path = path.join('/');

	path = 'http://' + config.S3_CDN_HOST + path;

	request({
		url: path
	}).on('error', next).pipe(res);
}

function saveUnknownName(req, data) {
	data.ip = req.headers['x-real-ip'] || req.ip;
	var referrer = req.get('referrer');
	if (referrer) {
		referrer = url.parse(referrer);
		data.host = referrer.host || referrer.hostname;
	} else {
		//data.host = 'localhost';
		return null;
	}

	data.name = data.name
		//.replace(/[_:\?!\|\/\\@~#\$%\^*-]/g, ' ')
		.replace(/\s{2,}/g, ' ')
		.trim();

	return Data.control.createUnknownName(data)
		.then(function() {
			//console.log('un', un);
		})
		.catch(function() {
			//console.log('error', e);
		});
}

function pictureRoute(req, res, next, name, size, lang, country) {
	var uniquenames = [];
	var ids = [];
	var uname;
	var cuname;
	var hasCulture;

	utils.maxageNoPicture(res);

	if (name.length < 2 || name.length > 100) {
		return next();
	}

	uname = Text.uniqueName(name);
	uniquenames.push(uname);
	ids.push(core.util.md5(uname));
	if (lang) {
		cuname = Text.cultureUniqueName(uname, lang);
		uniquenames.push(cuname);
		ids.push(core.util.md5(cuname));
	}
	if (lang && country) {
		hasCulture = true;
		cuname = Text.cultureUniqueName(uname, lang, country);
		uniquenames.push(cuname);
		ids.push(core.util.md5(cuname));
	}

	Data.access.uniquenames({
		where: {
			_id: {
				$in: ids
			}
		}
	}).then(function(list) {
		// console.log('list', list);
		if (list.length === 0) {
			if (hasCulture) {
				saveUnknownName(req, {
					name: name,
					lang: lang,
					country: country
				});
			}
			return utils.sendEmptyImage(res);
		}

		list = _.sortBy(list, function(item) {
			return item.uniqueName.length;
		});
		var un = list[list.length - 1];

		sendS3Picture(res, next, un.pictureId, size);
	}).catch(next);
}

route.get('/:lang(\\w{2})-:country(\\w{2})/:size(x|a|b|c|d|e|f)?/:name.jpg', function(req, res, next) {
	var name = req.params.name.trim();
	var lang = req.params.lang;
	var country = req.params.country;
	var size = req.params.size;

	pictureRoute(req, res, next, name, size, lang, country);
});

route.get('/:lang(\\w{2})/:size(x|a|b|c|d|e|f)?/:name.jpg', function(req, res, next) {
	var name = req.params.name.trim();
	var lang = req.params.lang;
	if (lang === 'md') {
		lang = 'ro';
	}
	var size = req.params.size;

	pictureRoute(req, res, next, name, size, lang);
});

route.get('/:size(x|a|b|c|d|e|f)?/:name.jpg', function(req, res, next) {
	var name = req.params.name.trim();
	var size = req.params.size;
	var lang;
	var country;

	// test if format: UNIQUENAME__LANG-COUNTRY.jpg
	var un = Text.parseCultureUniqueName(name);

	if (un) {
		name = un.name;
		lang = un.lang;
		country = un.country;
	}

	pictureRoute(req, res, next, name, size, lang, country);
});

route.get('/picture/:size(x|a|b|c|d|e|f)?/:id.jpg', function(req, res, next) {
	sendS3Picture(res, next, req.params.id, req.params.size);
});
