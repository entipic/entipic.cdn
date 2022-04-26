import { Response, NextFunction } from "express";
import sharp from "sharp";
import got from "got";
import { Duplex } from "stream";
import { PictureSizeName, PictureHelper } from "@entipic/domain";
import { PictureFormat } from "./types";

export function handleImageId(
  id: string,
  format: PictureFormat,
  size: PictureSizeName,
  res: Response,
  next: NextFunction
) {
  const originalFormat = "jpg";
  const masterSizeName = "f";
  const url = PictureHelper.formatS3Url(id);

  const stream = got
    .stream(url, { timeout: { response: 3000 } })
    .on("error", (error) => next(error));

  if (format === originalFormat && size === masterSizeName) {
    return sendImage(stream, res, format);
  }
  let instance = sharp();
  if (format !== originalFormat) {
    instance = instance.toFormat(format, { quality: 100 });
  }
  if (size !== masterSizeName) {
    const newSize = PictureHelper.getPictureSize(size);
    instance = instance.resize(newSize, newSize, { kernel: "cubic" });
  }

  return sendImage(stream.pipe(instance as never), res, format);
}

function sendImage(stream: Duplex, res: Response, format: PictureFormat) {
  res.setHeader("content-type", getMime(format));
  res.setHeader("cache-control", "public,max-age=2592000"); // 30 days

  stream.on("data", (chunk) => {
    res.setHeader("content-length", chunk.length);
  });

  stream.pipe(res as never, { end: true });
}

function getMime(format: PictureFormat) {
  if (format === "webp") {
    return "image/webp";
  }
  return "image/jpeg";
}
