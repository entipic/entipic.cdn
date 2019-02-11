import { Request, Response, NextFunction } from "express";
import { PictureSizeName, UniqueNameHelper, UnknownNameHelper } from '@entipic/domain';
import { uniqueNameRepository, unknownNameRepository } from "./data";
import { handleImageId } from "./handle-image-id";
import { ImageHandlerParams, PictureFormat } from "./types";
import { parse } from "url";
import { logger } from "./logger";

const EMPTY_IMAGE = new Buffer([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 1, 3, 0, 0, 0, 37, 219, 86, 202, 0, 0, 0, 3, 80, 76, 84, 69, 0, 0, 0, 167, 122, 61, 218, 0, 0, 0, 1, 116, 82, 78, 83, 0, 64, 230, 216, 102, 0, 0, 0, 10, 73, 68, 65, 84, 8, 215, 99, 96, 0, 0, 0, 2, 0, 1, 226, 33, 188, 51, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

export default async (req: Request, res: Response, next: NextFunction) => {

    const params = formatParams(req);

    if (params.id) {
        return handleImageId(params.id, params.format, params.size, res, next);
    }

    if (!params.name) {
        return next(new Error(`name is required!`));
    }

    const ids = [UniqueNameHelper.createId({ name: params.name, lang: params.lang })];
    if (params.country) {
        ids.unshift(UniqueNameHelper.createId({ name: params.name, lang: params.lang, country: params.country }));
    }
    const unames = await uniqueNameRepository.getByIds(ids);

    if (!unames.length) {
        try {
            await unknownNameRepository.create(UnknownNameHelper.build({
                country: params.country,
                lang: params.lang,
                name: params.name,
                refHost: params.refHost,
                refIP: params.refIP,
            }));
        } catch (error) {
            if (error.code !== 11000) {
                logger.error(error);
            }
        }

        return sendEmptyImage(res);
    }

    return handleImageId(unames[0].pictureId, params.format, params.size, res, next);
}

function sendEmptyImage(res: Response) {
    res.set({
        'content-type': 'image/png',
        'content-length': EMPTY_IMAGE.length,
        'Cache-Control': 'public, max-age=1200',
    });

    res.send(EMPTY_IMAGE);
}

function formatParams(req: Request): ImageHandlerParams {
    let refIP = (req.headers['x-forwarded-for'] || req.headers['x-real-ip']) as string || req.ip;
    refIP = refIP === '::1' ? '127.0.0.1' : refIP;
    const parts = refIP.split(/,\s*/g);
    refIP = parts[parts.length - 1];
    let refHost: string | undefined
    const referrer = req.get('referrer');
    if (referrer) {
        const parsedUrl = parse(referrer);
        refHost = parsedUrl.host || parsedUrl.hostname;
    }
    let lang = req.params.lang || 'en';
    if (lang === 'md') {
        lang = 'ro';
    }

    let name = req.params.name as string;
    if (name) {
        name = name.replace(/[\s_-]/g, ' ').replace(/\s{2,}/, ' ').trim();
    }

    return {
        id: req.params.id,
        name,
        lang,
        country: req.params.country,
        format: req.params.format as PictureFormat,
        size: (req.params.size || 'a') as PictureSizeName,
        refIP,
        refHost
    }
}
