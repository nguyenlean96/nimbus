import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const localStorageConfig = {
  storage: diskStorage({
    destination: './storage/public/tmp',
    filename: (req, file, callback) => {
      const uniqueSuffix = `${uuidv4()}`;
      const ext = extname(file.originalname);
      callback(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};