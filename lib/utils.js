var external = module.exports;

var NO_CACHE = 'private, max-age=0, no-cache';
var PUBLIC_CACHE = 'public, max-age=';
var CACHE_CONTROL = 'Cache-Control';

var EMPTY_IMAGE = external.EMPTY_IMAGE = new Buffer([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 1, 3, 0, 0, 0, 37, 219, 86, 202, 0, 0, 0, 3, 80, 76, 84, 69, 0, 0, 0, 167, 122, 61, 218, 0, 0, 0, 1, 116, 82, 78, 83, 0, 64, 230, 216, 102, 0, 0, 0, 10, 73, 68, 65, 84, 8, 215, 99, 96, 0, 0, 0, 2, 0, 1, 226, 33, 188, 51, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

external.sendEmptyImage = function(res) {
  res.set({
    'Content-Type': 'image/png',
    'Content-Length': EMPTY_IMAGE.length
  });

  res.send(EMPTY_IMAGE);
};

/**
 * Set response Cache-Control
 * @maxage integet in minutes
 */
external.maxage = function(res, maxage) {
  //maxage = 0;
  var cache = NO_CACHE;
  if (maxage > 0) {
    cache = PUBLIC_CACHE + (maxage * 60);
  }
  res.set(CACHE_CONTROL, cache);
};

external.maxageNoPicture = function(res) {
  external.maxage(res, 60 * 4);
};

external.maxageRedirect = function(res) {
  external.maxage(res, 60 * 12);
};

external.maxageIndex = function(res) {
  external.maxage(res, 10);
};

external.maxageSearch = function(res) {
  external.maxage(res, 60 * 2);
};
