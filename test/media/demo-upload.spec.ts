/**
 * Resilient Upload Demonstration
 * 
 * This test demonstrates how to use the retry utility to handle ECONNRESET errors
 * and other transient network issues during file uploads.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import {
  uploadFileWithRetry,
  batchUploadWithRetry,
  createSampleTextFile,
  createMinimalJpegFile
} from '@test/media/upload-client.util';

describe('Resilient Upload Demonstration', () => {
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

  it('should handle a single file upload with retry mechanism', async () => {
    // Create a sample JPEG file
    const filePath = createMinimalJpegFile('demo-1');
    
    // Upload the file with retry enabled
    const result = await uploadFileWithRetry({
      appInstance: app,
      filePath,
      collection: 'demo-images',
      verbose: true,
      retryOptions: {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 2000,
        backoffFactor: 2,
        jitter: true
      }
    });
    
    // Log the result
    console.log('Single file upload result:', {
      success: result.success,
      statusCode: result.statusCode,
      timeMs: result.timeMs,
      attempts: result.attempts
    });
    
    // The upload should succeed
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(201);
  }, 10000);
  
  it('should handle high-concurrency uploads with controlled concurrency limit', async () => {
    const fileCount = 50;
    const concurrencyLimit = 10;
    
    console.log(`\nUploading ${fileCount} files with concurrency limit of ${concurrencyLimit}`);
    
    // Create multiple files to upload
    const files: string[] = [];
    for (let i = 0; i < fileCount; i++) {
      // Alternate between text files and images
      if (i % 2 === 0) {
        files.push(createSampleTextFile(10 * 1024, `batch-${i}`)); // 10KB text files
      } else {
        files.push(createMinimalJpegFile(`batch-${i}`));
      }
    }
    
    // Use batch upload with concurrency limiting and retry
    const results = await batchUploadWithRetry(files, {
      appInstance: app,
      collection: 'batch-uploads',
      concurrencyLimit,
      verbose: false,
      retryOptions: {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffFactor: 1.5,
      }
    });
    
    // Calculate statistics
    const successCount = results.filter(r => r.success).length;
    const successRate = (successCount / fileCount) * 100;
    const avgTime = results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
    const retryAttempts = results.reduce((sum, r) => sum + (r.attempts > 1 ? r.attempts - 1 : 0), 0);
    
    console.log(`\nBatch Upload Results (${fileCount} files):`);
    console.log(`Success rate: ${successRate.toFixed(2)}%`);
    console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
    console.log(`Total retry attempts: ${retryAttempts}`);
    
    // Group failures by error type if any
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      const errorTypes = {};
      failures.forEach(failure => {
        const errorType = failure.error?.code || 'unknown';
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      });
      console.log('Error breakdown:', errorTypes);
    }
    
    // We expect a high success rate with controlled concurrency
    expect(successRate).toBeGreaterThanOrEqual(95);
  }, 60000);
  
  it('should handle large file uploads with retries', async () => {
    const fileSizes = [
      100 * 1024,     // 100 KB
      500 * 1024,     // 500 KB
      1024 * 1024,    // 1 MB
      2 * 1024 * 1024 // 2 MB
    ];
    
    const results = [];
    
    for (const size of fileSizes) {
      const filePath = createSampleTextFile(size, `large-${size}`);
      
      console.log(`\nUploading file of size: ${(size / 1024).toFixed(1)} KB`);
      
      const result = await uploadFileWithRetry({
        appInstance: app,
        filePath,
        collection: 'large-files',
        verbose: true,
        timeoutMs: 30000, // Longer timeout for large files
        retryOptions: {
          maxRetries: 4,       // More retries for large files
          initialDelayMs: 200, // Start with slightly longer delay
          maxDelayMs: 5000,    // Allow up to 5 second delays
          backoffFactor: 2,
          jitter: true
        }
      });
      
      results.push({
        size: size / 1024, // KB
        success: result.success,
        attempts: result.attempts,
        timeMs: result.timeMs
      });
    }
    
    console.log('\nLarge file upload results:');
    results.forEach(r => {
      console.log(`${r.size} KB: ${r.success ? 'Success' : 'Failed'}, ${r.attempts} attempts, ${r.timeMs}ms`);
    });
    
    // Check if all uploads were successful
    const allSuccessful = results.every(r => r.success);
    expect(allSuccessful).toBe(true);
  }, 120000);
  
  it('should demonstrate retry with forced ECONNRESET errors (simulation)', async () => {
    let attemptCount = 0;
    let errorSimulated = false;
    
    // We'll use the retry utility directly to demonstrate error handling
    const result = await retry(
      async () => {
        attemptCount++;
        
        // Simulate a connection reset on the first attempt
        if (attemptCount === 1) {
          errorSimulated = true;
          const error: any = new Error('Simulated ECONNRESET error');
          error.code = 'ECONNRESET';
          throw error;
        }
        
        // On second attempt, return success
        return { success: true, message: 'Upload succeeded after retry' };
      },
      {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        jitter: false, // Disable jitter for predictable testing
        onRetry: (error, attempt, delay) => {
          console.log(`Retry attempt ${attempt} after ${delay}ms due to: ${error.code}`);
        }
      }
    );
    
    console.log('\nRetry demonstration result:', result);
    
    expect(errorSimulated).toBe(true);
    expect(attemptCount).toBe(2); // Original attempt + 1 retry
    expect(result.success).toBe(true);
  });
});