import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Media Upload E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Helper function to create test files of different types and sizes
   */
  const createTestFile = (
    fileName: string,
    content: string | Buffer,
  ): string => {
    const filePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  describe('/media (POST) - File Upload Validation', () => {
    it('should accept a valid image file', async () => {
      // Create a small JPEG file
      const validImagePath = createTestFile(
        'valid-image.jpg',
        Buffer.from(
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
          'base64'
        )
      );

      // Make the request
      return request(app.getHttpServer())
        .post('/media')
        .attach('file', validImagePath)
        .field('collection', 'test-images')
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('urls');
          expect(response.body.mimeType).toBe('image/jpeg');
          // Clean up test file
          fs.unlinkSync(validImagePath);
        });
    });

    it('should accept a valid PDF file', async () => {
      // Create a simple PDF file
      // This is a minimal valid PDF content
      const pdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF';
      const validPdfPath = createTestFile('valid-doc.pdf', pdfContent);

      // Make the request
      return request(app.getHttpServer())
        .post('/media')
        .attach('file', validPdfPath)
        .field('collection', 'test-documents')
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('urls');
          expect(response.body.mimeType).toBe('application/pdf');
          // Clean up test file
          fs.unlinkSync(validPdfPath);
        });
    });

    it('should reject executable files (.exe)', async () => {
      // Create a fake .exe file
      // Just a binary content with MZ header
      const exeContent = Buffer.from('4D5A900003000000040000000FFFF0000B800000000000000400000000000000000000000000000000000000000000000000000000000000000000000', 'hex');
      const exePath = createTestFile('malicious.exe', exeContent);

      // Make the request
      return request(app.getHttpServer())
        .post('/media')
        .attach('file', exePath)
        .field('collection', 'test-documents')
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('not allowed for security reasons');
          // Clean up test file
          fs.unlinkSync(exePath);
        });
    });

    it('should reject DLL files', async () => {
      // Create a fake .dll file
      const dllPath = createTestFile('library.dll', 'fake dll content');

      // Make the request
      return request(app.getHttpServer())
        .post('/media')
        .attach('file', dllPath)
        .field('collection', 'test-documents')
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('not allowed for security reasons');
          // Clean up test file
          fs.unlinkSync(dllPath);
        });
    });

    it('should reject batch files', async () => {
      // Create a fake .bat file
      const batPath = createTestFile('script.bat', 'echo "This is a batch file"');

      // Make the request
      return request(app.getHttpServer())
        .post('/media')
        .attach('file', batPath)
        .field('collection', 'test-documents')
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('not allowed for security reasons');
          // Clean up test file
          fs.unlinkSync(batPath);
        });
    });

    it('should reject shell script files', async () => {
      // Create a fake .sh file
      const shPath = createTestFile('script.sh', '#!/bin/bash\necho "This is a shell script"');

      // Make the request
      return request(app.getHttpServer())
        .post('/media')
        .attach('file', shPath)
        .field('collection', 'test-documents')
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain('not allowed for security reasons');
          // Clean up test file
          fs.unlinkSync(shPath);
        });
    });

    it('should reject files with disallowed MIME types', async () => {
      // Create a file with an application/x-msdownload MIME type (typical for executables)
      const maliciousPath = createTestFile('malicious.bin', Buffer.from('fake binary content'));

      // Make the request with a manipulated mime type
      return request(app.getHttpServer())
        .post('/media')
        .attach('file', maliciousPath)
        .set('Content-Type', 'multipart/form-data; boundary=X')
        .field('collection', 'test-documents')
        .expect(400)
        .then(() => {
          // Clean up test file
          fs.unlinkSync(maliciousPath);
        });
    });

    it('should reject files larger than 10MB', async () => {
      // Create a large file (just over 10MB)
      const largeFilePath = createTestFile(
        'large-file.txt', 
        Buffer.alloc(10 * 1024 * 1024 + 1, 'a')
      );

      // Make the request
      return request(app.getHttpServer())
        .post('/media')
        .attach('file', largeFilePath)
        .field('collection', 'test-documents')
        .expect(413) // Payload Too Large
        .then(() => {
          // Clean up test file
          fs.unlinkSync(largeFilePath);
        });
    });
  });

  describe('/media (GET) - Retrieve Media', () => {
    // This assumes there's at least one media item in the database
    it('should return a list of media items', () => {
      return request(app.getHttpServer())
        .get('/media')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  });

  describe('/media/:id (GET) - Get Media by ID', () => {
    // First create a media item, then retrieve it by ID
    let createdMediaId: number;

    beforeAll(async () => {
      // Create a test image
      const imagePath = createTestFile(
        'test-retrieve.jpg',
        Buffer.from(
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
          'base64'
        )
      );

      // Upload the image to get an ID
      const response = await request(app.getHttpServer())
        .post('/media')
        .attach('file', imagePath)
        .field('collection', 'test-retrieve')
        .expect(201);

      createdMediaId = response.body.id;
      fs.unlinkSync(imagePath);
    });

    it('should retrieve a media item by ID', () => {
      return request(app.getHttpServer())
        .get(`/media/${createdMediaId}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('id', createdMediaId);
          expect(response.body).toHaveProperty('urls');
          expect(response.body).toHaveProperty('collection', 'test-retrieve');
        });
    });

    it('should return 404 for non-existent media ID', () => {
      return request(app.getHttpServer())
        .get(`/media/99999`)
        .expect(404);
    });
  });

  describe('/media/:id (PATCH) - Update Media', () => {
    // First create a media item, then update it
    let createdMediaId: number;

    beforeAll(async () => {
      // Create a test image
      const imagePath = createTestFile(
        'test-update.jpg',
        Buffer.from(
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
          'base64'
        )
      );

      // Upload the image to get an ID
      const response = await request(app.getHttpServer())
        .post('/media')
        .attach('file', imagePath)
        .field('collection', 'test-update')
        .expect(201);

      createdMediaId = response.body.id;
      fs.unlinkSync(imagePath);
    });

    it('should update a media item', () => {
      return request(app.getHttpServer())
        .patch(`/media/${createdMediaId}`)
        .send({ collection: 'updated-collection' })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('id', createdMediaId);
          expect(response.body).toHaveProperty('collection', 'updated-collection');
        });
    });
  });

  describe('/media/:id (DELETE) - Delete Media', () => {
    // First create a media item, then delete it
    let createdMediaId: number;

    beforeAll(async () => {
      // Create a test image
      const imagePath = createTestFile(
        'test-delete.jpg',
        Buffer.from(
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
          'base64'
        )
      );

      // Upload the image to get an ID
      const response = await request(app.getHttpServer())
        .post('/media')
        .attach('file', imagePath)
        .field('collection', 'test-delete')
        .expect(201);

      createdMediaId = response.body.id;
      fs.unlinkSync(imagePath);
    });

    it('should delete a media item', () => {
      return request(app.getHttpServer())
        .delete(`/media/${createdMediaId}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('message', 'Media deleted successfully');
          
          // Verify it's actually gone
          return request(app.getHttpServer())
            .get(`/media/${createdMediaId}`)
            .expect(404);
        });
    });
  });
});