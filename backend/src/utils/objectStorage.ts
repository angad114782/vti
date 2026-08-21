import fs from 'fs/promises';
import path from 'path';
import { Client } from 'minio';

const root = path.resolve(__dirname, '..', '..', 'uploads');
const endpoint = process.env.MINIO_ENDPOINT;
const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;
const bucket = process.env.MINIO_BUCKET ?? 'vook-private';
const client = endpoint && accessKey && secretKey ? new Client({
  endPoint: endpoint,
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey,
  secretKey,
}) : null;

export const storageUsesMinio = Boolean(client);

export async function storeUploadedFile(category: string, filename: string, buffer: Buffer, contentType?: string) {
  const objectName = `${category}/${filename}`;
  if (client) {
    const exists = await client.bucketExists(bucket);
    if (!exists) await client.makeBucket(bucket, process.env.MINIO_REGION ?? 'us-east-1');
    await client.putObject(bucket, objectName, buffer, buffer.length, contentType ? { 'Content-Type': contentType } : undefined);
  } else {
    const directory = path.join(root, category);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, filename), buffer);
  }
  return objectName;
}

export async function getStoredFile(category: string, filename: string) {
  if (client) return client.getObject(bucket, `${category}/${filename}`);
  return fs.readFile(path.join(root, category, filename));
}
