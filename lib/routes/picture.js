var express = require('express'),
  core = require('entipic.core'),
  route = module.exports = express.Router(),
  utils = require('../utils.js'),
  Data = require('../data.js'),
  internal = {};


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

  if (name.length < 2 || name.length > 100) return next();

  console.log('name', name);

  next();
}
