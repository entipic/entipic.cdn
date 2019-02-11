import { PictureSizeName } from "@entipic/domain";

export type ImageHandlerParams = {
    id?: string
    format: PictureFormat
    name?: string
    size: PictureSizeName
    lang: string
    country?: string
    refIP: string
    refHost?: string
}

export type PictureFormat = 'jpg' | 'webp';
