import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';

// Disallowed file extensions (binary/executable files)
const DISALLOWED_FILE_EXTENSIONS = [
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.bin', 
  '.msi', '.app', '.dmg', '.sys', '.com'
];

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  // Video
  'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime',
  // Archives (if needed)
  'application/zip', 'application/x-rar-compressed'
];

export const localStorageConfig = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, callback) => {
    // Check file extension
    const ext = extname(file.originalname).toLowerCase();
    if (DISALLOWED_FILE_EXTENSIONS.includes(ext)) {
      return callback(
        new BadRequestException(`File type ${ext} is not allowed for security reasons`),
        false
      );
    }

    // Check mime type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(`File type ${file.mimetype} is not allowed`),
        false
      );
    }

    // File is valid
    callback(null, true);
  },
  storage: diskStorage({
    destination: './storage/public/tmp',
    filename: (req, file, callback) => {
      const uniqueSuffix = `${uuidv4()}`;
      const ext = extname(file.originalname);
      callback(null, `${uniqueSuffix}${ext}`);
    },
  }),
};