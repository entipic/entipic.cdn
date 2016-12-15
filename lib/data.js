'use strict';

const Data = require('entipic.data');
const connection = Data.connect(process.env.ENTIPIC_CONNECTION);
const db = Data.db(connection);

exports.control = new Data.ControlService(db);
exports.access = new Data.AccessService(db);
exports.Model = Data.model;

exports.close = function(cb) {
	connection.close(cb);
};
