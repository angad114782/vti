import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { storeUploadedFile } from '../utils/objectStorage';

// Base directory for uploads
const UPLOAD_BASE_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure base upload directory and subdirectories exist
const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.memoryStorage();

function hasExpectedSignature(file: Express.Multer.File, ext: string): boolean {
  const b = file.buffer;
  if (ext === '.pdf') return b.subarray(0, 4).toString('ascii') === '%PDF';
  if (ext === '.png') return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === '.jpg' || ext === '.jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (ext === '.docx' || ext === '.xlsx') return b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
  // CSV is text-based; reject binary control bytes while allowing UTF-8 BOM.
  if (ext === '.csv') return !b.subarray(0, Math.min(b.length, 4096)).includes(0);
  return false;
}

export async function persistUpload(file: Express.Multer.File, category: 'documents' | 'receipts') {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!hasExpectedSignature(file, ext)) throw new Error('The uploaded file content does not match its file type');
  const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
  const filename = `${baseName}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;
  await storeUploadedFile(category, filename, file.buffer, file.mimetype);
  return filename;
}

// Configure file filters
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

// Multer upload configurations
export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('document');

export const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('receipt');
