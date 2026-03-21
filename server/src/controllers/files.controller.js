import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env.js';

const UPLOAD_DIR = path.resolve(env.UPLOAD_DIR);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const type = req.body.type || 'misc';
    const patientId = req.body.patientId || 'unknown';
    const category = type.split('-')[0];
    const dir = path.join(UPLOAD_DIR, category, patientId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const suffix = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const type = req.body.type || 'file';
    cb(null, `${type}_${Date.now()}_${suffix}${ext}`);
  },
});

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Use JPEG, PNG, GIF, or PDF.'));
    }
  },
});

export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const type = req.body.type || 'misc';
  const patientId = req.body.patientId || 'unknown';
  const category = type.split('-')[0];
  const relativePath = `${category}/${patientId}/${req.file.filename}`;

  res.json({
    filePath: relativePath,
    fileName: req.file.originalname,
  });
}

export async function downloadFile(req, res) {
  const { type, patientId, filename } = req.params;

  // Sanitize path components
  if (filename.includes('..') || patientId.includes('..') || type.includes('..')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const filePath = path.join(UPLOAD_DIR, type, patientId, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
}
