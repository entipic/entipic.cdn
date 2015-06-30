var express = require('express');
var core = require('entipic.core');
var _ = core._;
var route = module.exports = express.Router();
var utils = require('../utils.js');
var Data = require('../data.js');
var internal = {};
var url = require('url');
var config = require('../config');
var Text = require('entipic.text');
var request = require('request');


route.get('/:lang(\\w{2})-:country(\\w{2})/:size(x|a|b|c|d|e|f)?/:name.jpg', function(req, res, next) {
  var name = req.params.name.trim();
  var lang = req.params.lang;
  var country = req.params.country;
  var size = req.params.size;

  pictureRoute(req, res, next, name, size, lang, country);
});

route.get('/:size(x|a|b|c|d|e|f)?/:name.jpg', function(req, res, next) {
  var name = req.params.name.trim();
  var size = req.params.size;

  pictureRoute(req, res, next, name, size);
});

function pictureRoute(req, res, next, name, size, lang, country) {
  var uniquenames = [];
  var ids = [];
  var uname;
  var cuname;
  var hasCulture;
  size = size || 'a';

  if (name.length < 2 || name.length > 100) return next();

  uname = Text.uniqueName(name);
  uniquenames.push(uname);
  ids.push(core.util.md5(uname));
  if (lang && country) {
    hasCulture = true;
    cuname = Text.cultureUniqueName(uname, lang, country);
    uniquenames.push(cuname);
    ids.push(core.util.md5(cuname));
  }

  console.log(uniquenames);

  Data.access.uniquenames({
    where: {
      _id: {
        $in: ids
      }
    }
  }).then(function(list) {
    console.log('list', list);
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
    var un = list.length === 1 ? list[0] : _.sortBy(list, function(item) {
      return item.uniqueName.length;
    })[list.length - 1];

    var path = ['/images'];
    if (size) path.push(size);
    path.push(un.pictureId + '.jpg');
    path = path.join('/');

    console.log('path', path);

    request({
      url: 'http://' + config.S3_CDN_HOST + path
    }).on('error', next).pipe(res);
  }).catch(next);
}

function saveUnknownName(req, data) {
  data.ip = req.ip;
  var referrer = req.get('referrer');
  //if (!referrer) return;
  //referrer = url.parse(referrer);
  //data.host = referrer.host || referrer.hostname;
  data.host = 'localhost';

  return Data.control.createUnknownName(data)
    .then(function(un) {
      console.log('un', un);
    })
    .catch(function(e) {
      console.log('error', e);
    });
}
