import sharp from "sharp";
import type { ProcessedImage } from "@/src/lib/media/types";

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  try {
    const image = sharp(input, { failOn: "none" }).rotate();
    const metadata = await image.metadata();

    const displayBuffer = await image
      .clone()
      .resize({ width: 1800, withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();

    const thumbnailBuffer = await image
      .clone()
      .resize({ width: 640, withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    return {
      displayBuffer,
      thumbnailBuffer,
      width: metadata.width,
      height: metadata.height,
    };
  } catch {
    return {};
  }
}
