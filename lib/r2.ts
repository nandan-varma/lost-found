import "server-only";

import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { MAX_FILE_SIZE } from "./constants";
import { getEnv } from "./env";
import { logger } from "./logger";

const R2_REGION = getEnv("R2_REGION");
const R2_ENDPOINT = getEnv("R2_ENDPOINT");
const R2_ACCESS_KEY_ID = getEnv("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = getEnv("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = getEnv("R2_BUCKET_NAME");
const R2_PUBLIC_URL = getEnv("R2_PUBLIC_URL");

const client = new S3Client({
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  endpoint: R2_ENDPOINT,
  forcePathStyle: true,
  region: R2_REGION,
});

export async function uploadFile(
  file: File,
  folder: string
): Promise<{ url: string; key: string }> {
  const originalName = file.name;

  if (!file.type.startsWith("image/")) {
    logger.warn("uploadFile: invalid mime type", {
      folder,
      mimeType: file.type,
    });
    throw new Error("Only image files are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    logger.warn("uploadFile: file too large", {
      folder,
      maxSize: MAX_FILE_SIZE,
      size: file.size,
    });
    throw new Error("File size must be less than 10 MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isSupportedImage(buffer)) {
    logger.warn("uploadFile: unsupported image format", {
      folder,
      mimeType: file.type,
      originalName,
    });
    throw new Error("Unsupported or invalid image file");
  }

  const key = `${folder}/${randomUUID()}-${sanitize(originalName)}`;

  logger.info("uploadFile: uploading", {
    folder,
    key,
    mimeType: file.type,
    originalName,
    size: file.size,
  });

  await client.send(
    new PutObjectCommand({
      Body: buffer,
      Bucket: R2_BUCKET_NAME,
      ContentType: file.type,
      Key: key,
    })
  );

  const url = `${R2_PUBLIC_URL}/${key}`;

  logger.info("uploadFile: success", { key, originalName, url });

  return { key, url };
}

export async function deleteFile(key: string): Promise<void> {
  logger.info("deleteFile: deleting", { key });

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );

  logger.info("deleteFile: success", { key });
}

function sanitize(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
}

function isSupportedImage(buffer: Buffer): boolean {
  const jpg =
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const png =
    buffer.length > 7 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const gif =
    buffer.length > 5 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61;
  const webp =
    buffer.length > 11 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  return jpg || png || gif || webp;
}
