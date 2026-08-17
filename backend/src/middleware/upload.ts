import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Base directory for uploads
const UPLOAD_BASE_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure base upload directory and subdirectories exist
const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine subdirectory based on field name or request URL path
    let subDir = 'general';
    if (file.fieldname === 'document') {
      subDir = 'documents';
    } else if (file.fieldname === 'receipt') {
      subDir = 'receipts';
    }

    const targetDir = path.join(UPLOAD_BASE_DIR, subDir);
    ensureDirExists(targetDir);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and prepend current timestamp to prevent conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric characters with underscore
      .substring(0, 100); // Limit name length

    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

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
