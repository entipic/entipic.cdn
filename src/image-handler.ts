import { Request, Response, NextFunction } from "express";
import {
  PictureSizeName,
  UniqueNameHelper,
  UnknownNameHelper
} from "@entipic/domain";
import { uniqueNameRepository, unknownNameRepository } from "./data";
import { handleImageId } from "./handle-image-id";
import { ImageHandlerParams, PictureFormat } from "./types";
import { parse } from "url";
import { logger } from "./logger";
import { EMPTY_IMAGE } from "./helpers";

export default async (req: Request, res: Response, next: NextFunction) => {
  const params = formatParams(req);

  if (params.id) {
    return handleImageId(params.id, params.format, params.size, res, next);
  }

  if (!params.name) {
    return next(new Error(`name is required!`));
  }

  const log = params.name === "edwin hubble";
  if (log) console.log(params);

  const ids = [
    UniqueNameHelper.createId({ name: params.name, lang: params.lang })
  ];
  if (params.country) {
    ids.unshift(
      UniqueNameHelper.createId({
        name: params.name,
        lang: params.lang,
        country: params.country
      })
    );
  }
  if (log) console.log("ids", ids);
  const unames = await uniqueNameRepository.getByIds(ids);
  if (log) console.log("unames", unames);

  if (!unames.length) {
    try {
      await unknownNameRepository.create(
        UnknownNameHelper.build({
          country: params.country,
          lang: params.lang,
          name: params.name,
          refHost: params.refHost,
          refIP: params.refIP
        })
      );
    } catch (error) {
      if (log) console.error(error);
      if (error.code !== 11000) {
        logger.error(error);
      }
    }

    return sendEmptyImage(res);
  }

  if (log) console.error("sending pucture", unames[0].pictureId);

  return handleImageId(
    unames[0].pictureId,
    params.format,
    params.size,
    res,
    next
  );
};

function sendEmptyImage(res: Response) {
  res.set({
    "content-type": "image/png",
    "content-length": EMPTY_IMAGE.length,
    "cache-control": "public,max-age=1200"
  });

  res.send(EMPTY_IMAGE);
}

function formatParams(req: Request): ImageHandlerParams {
  let refIP =
    ((req.headers["x-forwarded-for"] || req.headers["x-real-ip"]) as string) ||
    req.ip;
  refIP = refIP === "::1" ? "127.0.0.1" : refIP;
  const parts = refIP.split(/,\s*/g);
  refIP = parts[parts.length - 1];
  let refHost: string | undefined = undefined;
  const referrer = req.get("referrer");
  if (referrer) {
    const parsedUrl = parse(referrer);
    refHost = parsedUrl.host || parsedUrl.hostname || undefined;
  }
  let lang = req.params.lang || "en";
  if (lang === "md") {
    lang = "ro";
  }

  let name = req.params.name as string;
  if (name) {
    name = name
      .replace(/[\s_-]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return {
    id: req.params.id,
    name,
    lang,
    country: req.params.country,
    format: req.params.format as PictureFormat,
    size: (req.params.size || "a") as PictureSizeName,
    refIP,
    refHost
  };
}
