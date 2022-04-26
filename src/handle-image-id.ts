import { Response, NextFunction } from "express";
import sharp from "sharp";
import axios from "axios";
import { Duplex } from "stream";
import { PictureFormat } from "./types";
import { PictureHelper, PictureSizeName } from "@entipic/domain";

export async function handleImageId(
  id: string,
  format: PictureFormat,
  size: PictureSizeName,
  res: Response,
  next: NextFunction
) {
  const originalFormat = "jpg";
  const masterSizeName = "f";
  const url = PictureHelper.formatS3Url(id);
  let stream: Duplex;
  try {
    const { data } = await axios(url, {
      timeout: 3000,
      responseType: "stream"
    });
    stream = data;
  } catch (e) {
    return next(e);
  }

  if (format === originalFormat && size === masterSizeName)
    return sendImage(stream, res, format);

  let instance = sharp();
  if (format !== originalFormat)
    instance = instance.toFormat(format, { quality: 100 });

  if (size !== masterSizeName) {
    const newSize = PictureHelper.getPictureSize(size);
    instance = instance.resize(newSize, newSize, { kernel: "cubic" });
  }

  return sendImage(stream.pipe(instance), res, format);
}

function sendImage(stream: Duplex, res: Response, format: PictureFormat) {
  res.setHeader("content-type", getMime(format));
  res.setHeader("cache-control", "public,max-age=2592000"); // 30 days

  stream.on("data", (chunk) => {
    res.setHeader("content-length", chunk.length);
  });

  stream.pipe(res, { end: true });
}

function getMime(format: PictureFormat) {
  if (format === "webp") {
    return "image/webp";
  }
  return "image/jpeg";
}
