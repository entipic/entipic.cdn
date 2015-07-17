'use strict';

var external = module.exports;
var Data = require('entipic.data');
var connection = Data.connect(process.env.ENTIPIC_CONNECTION);
var db = Data.db(connection);

external.control = new Data.ControlService(db);
external.access = new Data.AccessService(db);
