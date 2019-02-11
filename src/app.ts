
require('dotenv').config();

import * as express from 'express';
import { logger } from './logger';
import imageHandler from './image-handler';
import { NextFunction, Response, Request } from 'express';
import { initData } from './data';
const cors = require('cors');
const PORT = process.env.PORT;

async function start() {
    const server = express();

    server.disable('x-powered-by');

    server.use(cors());

    const sizes = ['x', 'a', 'b', 'c', 'd', 'e', 'f'];

    server.get(`/picture/:size(${sizes.join('|')})/:id.:format(jpg|webp)`, imageHandler);
    server.get(`/picture/:id.:format(jpg|webp)`, imageHandler);

    server.get(`/:lang([a-z]{2})-:country([a-z]{2})/:size(${sizes.join('|')})/:name.:format(jpg|webp)`, imageHandler);
    server.get(`/:lang([a-z]{2})/:size(${sizes.join('|')})/:name.:format(jpg|webp)`, imageHandler);
    server.get(`/:lang([a-z]{2})-:country([a-z]{2})/:name.:format(jpg|webp)`, imageHandler);
    server.get(`/:size(${sizes.join('|')})/:name.:format(jpg|webp)`, imageHandler);
    server.get(`/:lang([a-z]{2})/:name.:format(jpg|webp)`, imageHandler);
    server.get(`/:name.:format(jpg|webp)`, imageHandler);

    server.use((_req, res) => res.sendStatus(404).end());

    server.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        logger.error(err.message, err);
        res.status(500).send(err.message);
    });

    await initData();
    await server.listen(PORT);
}

process.on('unhandledRejection', function (error: Error) {
    logger.error('unhandledRejection: ' + error.message, error);
});

process.on('uncaughtException', function (error: Error) {
    logger.error('uncaughtException: ' + error.message, error);
});

start()
    .then(() => logger.warn(`Listening at ${PORT}`))
    .catch(e => {
        logger.error(e);
    });
