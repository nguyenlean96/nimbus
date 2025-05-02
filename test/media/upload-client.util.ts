/**
 * Resilient Upload Client
 * 
 * This file demonstrates how to implement a resilient upload client that can handle
 * transient errors like ECONNRESET using the retry utility.
 */

import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { retry, RetryOptions } from '@/utils/retry';

/**
 * Creates a file with the specified content for testing purposes
 */
export const createTestFile = (
  fileName: string,
  content: string | Buffer,
): string => {
  const filePath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(filePath, content);
  return filePath;
};

/**
 * Options for the resilient upload function
 */
export interface ResilientUploadOptions {
  // The NestJS application instance to use for uploads
  appInstance: any;
  
  // The file path to upload
  filePath: string;
  
  // The collection to assign the file to
  collection?: string;
  
  // Base request timeout in milliseconds
  timeoutMs?: number;
  
  // Retry options for transient errors
  retryOptions?: RetryOptions;
  
  // Clean up file after upload
  cleanupFile?: boolean;
  
  // Verbose logging
  verbose?: boolean;
}

/**
 * Result of an upload operation
 */
export interface UploadResult {
  success: boolean;
  statusCode: number;
  timeMs: number;
  response?: any;
  attempts?: number;
  error?: any;
}

/**
 * Resilient upload function that handles transient errors with retries
 */
export async function uploadFileWithRetry(
  options: ResilientUploadOptions
): Promise<UploadResult> {
  const {
    appInstance,
    filePath,
    collection = 'default',
    timeoutMs = 30000,
    cleanupFile = true,
    verbose = false,
    retryOptions = {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 2000,
      backoffFactor: 2,
      jitter: true,
      onRetry: (error, attempt, delay) => {
        if (verbose) {
          console.log(
            `Retrying upload (attempt ${attempt}) after ${delay}ms due to error: ${error.code || error.message}`
          );
        }
      }
    }
  } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const startTime = Date.now();
  let attempts = 0;
  
  try {
    // Use the retry utility to handle ECONNRESET and other transient errors
    const response = await retry<any>(
      async () => {
        attempts++;
        
        if (verbose) {
          console.log(`Upload attempt ${attempts} for ${path.basename(filePath)}`);
        }
        
        // Make the upload request
        return await request(appInstance.getHttpServer())
          .post('/media')
          .attach('file', filePath)
          .field('collection', collection)
          .timeout(timeoutMs);
      },
      retryOptions
    );
    
    const endTime = Date.now();
    
    // Return successful upload result
    return {
      success: true,
      statusCode: response.statusCode,
      timeMs: endTime - startTime,
      response: response.body,
      attempts
    };
  } catch (error) {
    const endTime = Date.now();
    
    // Log error if verbose
    if (verbose) {
      console.error(`Upload failed after ${attempts} attempts:`, error);
    }
    
    // Return failed upload result
    return {
      success: false,
      statusCode: error.status || 0,
      timeMs: endTime - startTime,
      error,
      attempts
    };
  } finally {
    // Clean up the file if requested
    if (cleanupFile) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        if (verbose) {
          console.warn(`Failed to clean up file ${filePath}:`, e);
        }
      }
    }
  }
}

/**
 * Batch upload function that handles multiple files with retry logic
 */
export async function batchUploadWithRetry(
  files: string[],
  options: Omit<ResilientUploadOptions, 'filePath'> & { 
    concurrencyLimit?: number 
  }
): Promise<UploadResult[]> {
  const { concurrencyLimit = 10, ...baseOptions } = options;
  
  // Simple concurrency limiter
  const pendingUploads: Promise<UploadResult>[] = [];
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    
    // Create an upload task with the current file
    const uploadTask = uploadFileWithRetry({
      ...baseOptions,
      filePath
    });
    
    pendingUploads.push(uploadTask);
    
    // Wait for some uploads to complete if we've hit the concurrency limit
    if (pendingUploads.length >= concurrencyLimit || i === files.length - 1) {
      const batchResults = await Promise.all(pendingUploads);
      results.push(...batchResults);
      pendingUploads.length = 0;
    }
  }
  
  return results;
}

/**
 * Creates a sample text file of the specified size
 */
export function createSampleTextFile(
  sizeInBytes: number,
  uniqueId: string = ''
): string {
  const pattern = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const repeats = Math.ceil(sizeInBytes / pattern.length);
  const content = pattern.repeat(repeats).substring(0, sizeInBytes);
  
  return createTestFile(`sample-file-${uniqueId}-${sizeInBytes}bytes.txt`, content);
}

/**
 * Creates a minimal valid JPEG image file for testing
 */
export function createMinimalJpegFile(uniqueId: string = ''): string {
  // This is a minimal valid JPEG image data
  const minimalJpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
    'base64',
  );
  
  return createTestFile(`minimal-jpeg-${uniqueId}.jpg`, minimalJpeg);
}