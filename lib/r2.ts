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

  const key = `${folder}/${randomUUID()}-${sanitize(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

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
