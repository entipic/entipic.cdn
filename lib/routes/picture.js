'use strict';

const express = require('express');
/*eslint new-cap:0*/
const route = module.exports = express.Router();
const utils = require('../utils');
const _ = utils._;
const Data = require('../data');
const Url = require('url');
const config = require('../config');
const request = require('request');
const util = require('util');
const logger = require('../logger');

const KEY_FORMAT = 'v1/%s/%s/%s.jpg';

function formatKey(size, id) {
	return util.format(KEY_FORMAT, id.substr(0, 3), size, id);
};


function sendS3Picture(res, next, id, size, byId) {
	if (byId) {
		utils.maxageIdPicture(res);
	} else {
		utils.maxagePicture(res);
	}
	size = size || 'a';
	let path = formatKey(size, id);

	path = 'http://' + config.ENTIPIC_CDN_HOST + '/' + path;

	res.set('x-picture-id', id);

	request({
			url: path
		})
		.on('error', next)
		.on('response', (response) => {
			delete response.headers['cache-control'];
			delete response.headers['server'];
			delete response.headers['x-amz-id-2'];
			delete response.headers['x-amz-request-id'];
			delete response.headers['connection'];
		})
		.pipe(res);
}

function saveUnknownName(req, data) {
	data.ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
	data.ip = data.ip === '::1' ? '127.0.0.1' : data.ip;
	data.host = data.ip = data.ip.split(',')[0].trim();
	var referrer = req.get('referrer');
	if (referrer) {
		referrer = Url.parse(referrer);
		data.host = referrer.host || referrer.hostname;
	}

	data.name = data.name
		.replace(/[_\s-]/g, ' ')
		.replace(/\s{2,}/g, ' ')
		.trim();

	return Data.control.createUnknownName(data)
		.catch(function(e) {
			if (e.code !== 11000) {
				logger.error(e);
			}
		});
}

function pictureRoute(req, res, next, name, size, lang, country) {
	const ids = [];
	const hasLang = (typeof lang === 'string');

	utils.maxageNoPicture(res);

	if (name.length < 2 || name.length > 200) {
		// return utils.sendEmptyImage(res);
		return next(new Error('Invalid name:' + name));
	}

	lang = lang || 'en';

	const locale = Data.Model.locale(lang, country);

	ids.push(Data.Model.uniqueNameId(name, lang));

	if (country) {
		ids.push(Data.Model.uniqueNameId(name, lang, country));
	}

	Data.access.uniquenames({
		where: {
			_id: {
				$in: ids
			}
		}
	}).then(function(list) {
		if (list.length === 0) {
			if (hasLang) {
				saveUnknownName(req, {
					name: name,
					lang: lang,
					country: country
				});
			}
			return utils.sendEmptyImage(res);
		}

		const localeUn = _.find(list, function(item) {
			return item.locale === locale;
		});

		if (hasLang && !localeUn) {
			saveUnknownName(req, {
				name: name,
				lang: lang,
				country: country
			});
		}
		const un = localeUn || list[0];

		sendS3Picture(res, next, un.pictureId, size);
	}).catch(next);
}

route.get('/:lang(\\w{2})-:country(\\w{2})/:size(x|a|b|c|d|e|f)?/:name.jpg', function(req, res, next) {
	const name = req.params.name.trim();
	const lang = req.params.lang;
	const country = req.params.country;
	const size = req.params.size;

	pictureRoute(req, res, next, name, size, lang, country);
});

route.get('/:lang(\\w{2})/:size(x|a|b|c|d|e|f)?/:name.jpg', function(req, res, next) {
	const name = req.params.name.trim();
	let lang = req.params.lang;
	if (lang === 'md') {
		lang = 'ro';
	}
	const size = req.params.size;

	pictureRoute(req, res, next, name, size, lang);
});

route.get('/:size(x|a|b|c|d|e|f)?/:name.jpg', function(req, res, next) {
	const name = req.params.name.trim();
	const size = req.params.size;

	pictureRoute(req, res, next, name, size);
});

route.get('/picture/:size(x|a|b|c|d|e|f)?/:id.jpg', function(req, res, next) {
	sendS3Picture(res, next, req.params.id, req.params.size, true);
});
