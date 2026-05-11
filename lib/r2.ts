import "server-only";

import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { MAX_FILE_SIZE } from "./constants";
import { getEnv } from "./env";

const R2_REGION = getEnv("R2_REGION");
const R2_ENDPOINT = getEnv("R2_ENDPOINT");
const R2_ACCESS_KEY_ID = getEnv("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = getEnv("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = getEnv("R2_BUCKET_NAME");
const R2_PUBLIC_URL = getEnv("R2_PUBLIC_URL");

const client = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function uploadFile(
  file: File,
  folder: string
): Promise<{ url: string; key: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be less than 10 MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isSupportedImage(buffer)) {
    throw new Error("Unsupported or invalid image file");
  }

  const key = `${folder}/${randomUUID()}-${sanitize(file.name)}`;

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const url = `${R2_PUBLIC_URL}/${key}`;

  return { url, key };
}

export async function deleteFile(key: string): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
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
