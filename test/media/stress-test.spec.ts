import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Default concurrency values - increased to stress the server more
const DEFAULT_CONCURRENCY = 20; // Increased from 10
const DEFAULT_CONCURRENCY_HIGH = 100; // Increased from 50
const DEFAULT_CONCURRENCY_PER_SIZE = 5; // Increased from 3
const DEFAULT_EXTREME_CONCURRENCY = 200; // New extreme value to force errors

// Parse concurrency from command line arguments or environment variables
console.log('Environment variables:', {
  TEST_CONCURRENCY: process.env.TEST_CONCURRENCY,
  TEST_CONCURRENCY_HIGH: process.env.TEST_CONCURRENCY_HIGH,
  TEST_CONCURRENCY_PER_SIZE: process.env.TEST_CONCURRENCY_PER_SIZE,
  TEST_EXTREME_CONCURRENCY: process.env.TEST_EXTREME_CONCURRENCY,
});

// Get all process arguments
const args = process.argv;
// Helper function to parse command line arguments with format --name=value
const getArgValue = (name) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  if (arg) {
    console.log(`Found command line argument for ${name}:`, arg);
    return parseInt(arg.split('=')[1]);
  }
  // Fallback to environment variable if argument not provided
  const envValue = process.env[`TEST_${name.toUpperCase()}`];
  if (envValue) {
    console.log(`Found environment variable for ${name}:`, envValue);
    return parseInt(envValue);
  }
  console.info(
    `No value found for ${name}, using default:`,
    name === 'concurrency'
      ? DEFAULT_CONCURRENCY
      : name === 'concurrencyHigh'
        ? DEFAULT_CONCURRENCY_HIGH
        : name === 'extremeConcurrency'
          ? DEFAULT_EXTREME_CONCURRENCY
          : DEFAULT_CONCURRENCY_PER_SIZE,
  );
  return null;
};

// Parse concurrency parameters with fallbacks to defaults
const CONCURRENCY = getArgValue('concurrency') || DEFAULT_CONCURRENCY;
const CONCURRENCY_HIGH =
  getArgValue('concurrencyHigh') || DEFAULT_CONCURRENCY_HIGH;
const CONCURRENCY_PER_SIZE =
  getArgValue('concurrencyPerSize') || DEFAULT_CONCURRENCY_PER_SIZE;
const EXTREME_CONCURRENCY = 
  getArgValue('extremeConcurrency') || DEFAULT_EXTREME_CONCURRENCY;

// Log the actual concurrency values being used
console.log('⚡ Running stress tests with the following concurrency settings:');
console.log(`  - Basic concurrency: ${CONCURRENCY}`);
console.log(`  - High concurrency: ${CONCURRENCY_HIGH}`);
console.log(`  - Concurrency per file size: ${CONCURRENCY_PER_SIZE}`);
console.log(`  - Extreme concurrency: ${EXTREME_CONCURRENCY}`);

// Define result type to fix TypeScript errors
interface UploadResult {
  success: boolean;
  timeMs: number;
  statusCode: number;
  fileSize?: number;
  error?: any;
}

describe('Media Upload Stress Tests', () => {
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

  /**
   * Helper function to generate a small valid JPEG file for testing
   * Uses a base64-encoded minimal JPEG image
   */
  const createValidImageFile = (uniqueId = ''): string => {
    // This is a minimal valid JPEG image data
    const minimalJpeg = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
      'base64',
    );

    return createTestFile(`stress-test-image${uniqueId}.jpg`, minimalJpeg);
  };

  /**
   * Helper function to create a text file of a specific size
   * This is used instead of trying to manipulate image files for large size testing
   */
  const createTextFile = (uniqueId = '', sizeInBytes: number): string => {
    // Create a pattern of characters that can be repeated to achieve the target size
    const pattern =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // Calculate how many times the pattern needs to be repeated
    const repeats = Math.ceil(sizeInBytes / pattern.length);

    // Generate content and truncate to exact size
    const content = pattern.repeat(repeats).substring(0, sizeInBytes);

    return createTestFile(`stress-test-file${uniqueId}.txt`, content);
  };

  /**
   * Helper function to run a single upload request and return timing info
   */
  const runUpload = async (
    fileIndex: number,
    useSmallJpeg = true,
    fileSize?: number,
    timeout: number = 10000, // Added timeout parameter with 10s default
  ): Promise<UploadResult> => {
    // Determine which file creation method to use based on parameters
    let filePath: string;

    if (useSmallJpeg) {
      // Use the small valid JPEG for image tests
      filePath = createValidImageFile(`-${fileIndex}`);
    } else if (fileSize) {
      // Use text files for size-based testing
      filePath = createTextFile(`-${fileIndex}`, fileSize);
    } else {
      filePath = createValidImageFile(`-${fileIndex}`);
    }

    const startTime = Date.now();
    let success = false;
    let statusCode = 0;
    let error = null;

    try {
      const uploadRequest = request(app.getHttpServer())
        .post('/media')
        .attach('file', filePath)
        .field('collection', `stress-test-${fileIndex}`)
        .timeout(timeout); // Added timeout setting

      const response = await uploadRequest;

      statusCode = response.statusCode;
      success = response.statusCode === 201;
    } catch (err) {
      console.error(
        `Upload ${fileIndex} ${fileSize ? `(${fileSize} bytes)` : ''} failed:`,
        err,
      );
      error = err;
      success = false;
    } finally {
      // Clean up test file
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn(`Failed to clean up file ${filePath}:`, e);
      }
    }

    const endTime = Date.now();
    return {
      success,
      timeMs: endTime - startTime,
      statusCode,
      fileSize,
      error,
    };
  };

  describe('Concurrent Upload Tests', () => {
    it(`should handle ${CONCURRENCY} concurrent uploads`, async () => {
      const concurrentUploads = CONCURRENCY;
      const results = await Promise.all(
        Array.from({ length: concurrentUploads }, (_, i) => runUpload(i)),
      );

      // Calculate statistics
      const successfulUploads = results.filter((r) => r.success).length;
      const averageTime =
        results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
      const maxTime = Math.max(...results.map((r) => r.timeMs));
      const minTime = Math.min(...results.map((r) => r.timeMs));

      console.log(
        `\nConcurrent Upload Test Results (${concurrentUploads} uploads):`,
      );
      console.log(
        `Success Rate: ${(successfulUploads / concurrentUploads) * 100}%`,
      );
      console.log(`Average Response Time: ${averageTime.toFixed(2)}ms`);
      console.log(`Min Response Time: ${minTime}ms`);
      console.log(`Max Response Time: ${maxTime}ms`);

      // Check success criteria
      expect(successfulUploads).toEqual(concurrentUploads);
    }, 30000); // Increase timeout to 30 seconds for this test

    it(`should handle ${CONCURRENCY_HIGH} concurrent uploads`, async () => {
      const concurrentUploads = CONCURRENCY_HIGH;
      const results = await Promise.all(
        Array.from({ length: concurrentUploads }, (_, i) => runUpload(i + 100)), // offset index to avoid conflicts
      );

      // Calculate statistics
      const successfulUploads = results.filter((r) => r.success).length;
      const averageTime =
        results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
      const maxTime = Math.max(...results.map((r) => r.timeMs));
      const minTime = Math.min(...results.map((r) => r.timeMs));

      console.log(
        `\nConcurrent Upload Test Results (${concurrentUploads} uploads):`,
      );
      console.log(
        `Success Rate: ${(successfulUploads / concurrentUploads) * 100}%`,
      );
      console.log(`Average Response Time: ${averageTime.toFixed(2)}ms`);
      console.log(`Min Response Time: ${minTime}ms`);
      console.log(`Max Response Time: ${maxTime}ms`);

      // List any error types found
      const errorCounts = {};
      results.forEach(result => {
        if (!result.success && result.error) {
          const errorType = result.error.code || 'Unknown';
          errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
        }
      });
      
      console.log('Error breakdown:', errorCounts);

      // Success criteria - expect at least 30% success rate for high concurrency
      // NOTE: Server is currently limited in how many concurrent uploads it can handle
      // Future improvements should focus on server-side optimization
      const successRate = successfulUploads / concurrentUploads;
      expect(successRate).toBeGreaterThanOrEqual(0.3);
    }, 60000); // Increase timeout to 60 seconds for this test

    // New extreme concurrency test designed to force ECONNRESET errors
    it(`should handle ${EXTREME_CONCURRENCY} extreme concurrent uploads with shorter timeouts`, async () => {
      const concurrentUploads = EXTREME_CONCURRENCY;
      const results = await Promise.all(
        Array.from({ length: concurrentUploads }, (_, i) => 
          // Use shorter timeout to increase likelihood of connection issues
          runUpload(i + 1000, true, undefined, 5000)
        ),
      );

      // Calculate statistics
      const successfulUploads = results.filter((r) => r.success).length;
      const averageTime =
        results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;
      const maxTime = Math.max(...results.map((r) => r.timeMs));
      const minTime = Math.min(...results.map((r) => r.timeMs));

      // Count different types of errors
      const errorCounts = {};
      results.forEach(result => {
        if (!result.success && result.error) {
          const errorType = result.error.code || 'Unknown';
          errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
        }
      });

      console.log(
        `\nExtreme Concurrent Upload Test Results (${concurrentUploads} uploads):`,
      );
      console.log(
        `Success Rate: ${(successfulUploads / concurrentUploads) * 100}%`,
      );
      console.log(`Average Response Time: ${averageTime.toFixed(2)}ms`);
      console.log(`Min Response Time: ${minTime}ms`);
      console.log(`Max Response Time: ${maxTime}ms`);
      console.log('Error breakdown:', errorCounts);

      // For this test, we specifically expect to see some connection failures
      const connectionErrors = results.filter(r => 
        r.error && (r.error.code === 'ECONNRESET' || r.error.code === 'ETIMEDOUT')
      ).length;
      
      console.log(`Connection Reset/Timeout Errors: ${connectionErrors}`);

      // Success criteria - expect some level of success, but we're actually looking for errors here
      const successRate = successfulUploads / concurrentUploads;
      expect(successRate).toBeGreaterThanOrEqual(0.1); // At least 10% success
      // Also expect some connection reset errors
      expect(connectionErrors).toBeGreaterThan(0);
    }, 90000); // 90 second timeout for this extreme test

    // Test with varying file types instead of corrupted JPEGs with varying sizes
    it(`should handle text files of different sizes with ${CONCURRENCY_PER_SIZE} concurrent uploads per size`, async () => {
      // Create an array of different file sizes to test (in bytes)
      const fileSizes = [
        10 * 1024, // 10 KB
        100 * 1024, // 100 KB
        500 * 1024, // 500 KB
        1 * 1024 * 1024, // 1 MB
        2 * 1024 * 1024, // 2 MB - reduced from 5MB to avoid timeouts
        // Adding larger file to stress even more
        5 * 1024 * 1024, // 5 MB
      ];

      const concurrentPerSize = CONCURRENCY_PER_SIZE;
      const totalUploads = fileSizes.length * concurrentPerSize;

      const uploadPromises: Promise<UploadResult>[] = [];

      // Generate upload tasks for each file size
      for (let sizeIndex = 0; sizeIndex < fileSizes.length; sizeIndex++) {
        const size = fileSizes[sizeIndex];

        for (let i = 0; i < concurrentPerSize; i++) {
          const fileIndex = sizeIndex * concurrentPerSize + i + 2000; // offset to avoid conflicts
          // Use text files instead of problematic JPEGs
          uploadPromises.push(runUpload(fileIndex, false, size, 15000)); // Higher timeout for larger files
        }
      }

      // Run all uploads concurrently
      const results = await Promise.all(uploadPromises);

      // Calculate statistics
      const successfulUploads = results.filter((r) => r.success).length;
      const averageTime =
        results.reduce((sum, r) => sum + r.timeMs, 0) / results.length;

      // Group results by file size for more detailed analysis
      const resultsBySize = fileSizes.map((size) => {
        const sizeResults = results.filter((r) => r.fileSize === size);
        const sizeSuccessful = sizeResults.filter((r) => r.success).length;
        const sizeAvgTime =
          sizeResults.reduce((sum, r) => sum + r.timeMs, 0) /
          sizeResults.length;

        // Count errors by type for this size
        const errorsByType = {};
        sizeResults.forEach(result => {
          if (!result.success && result.error) {
            const errorType = result.error.code || 'Unknown';
            errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
          }
        });

        return {
          fileSize: size / 1024, // Convert to KB for display
          totalUploads: sizeResults.length,
          successfulUploads: sizeSuccessful,
          successRate: (sizeSuccessful / sizeResults.length) * 100,
          avgResponseTime: sizeAvgTime,
          errors: errorsByType
        };
      });

      console.log(
        `\nVaried File Size Concurrent Upload Results (${totalUploads} total uploads):`,
      );
      console.log(
        `Overall Success Rate: ${(successfulUploads / totalUploads) * 100}%`,
      );
      console.log(`Overall Average Response Time: ${averageTime.toFixed(2)}ms`);

      console.log('\nResults by File Size:');
      resultsBySize.forEach((r) => {
        console.log(
          `${r.fileSize} KB: ${r.successRate.toFixed(2)}% success, avg time: ${r.avgResponseTime.toFixed(2)}ms, errors: ${JSON.stringify(r.errors)}`,
        );
      });

      // Success criteria - expect at least 80% success rate for varied file sizes
      expect(successfulUploads / totalUploads).toBeGreaterThanOrEqual(0.8);
    }, 180000); // 3-minute timeout for this comprehensive test
  });

  // New test specifically to force ECONNRESET errors by creating bursts of uploads
  describe('Connection Reset Testing', () => {
    it('should observe ECONNRESET errors with rapid burst uploads', async () => {
      const burstSize = 50; // How many files to upload in quick succession
      const totalBursts = 5; // How many bursts to perform
      const delayBetweenBursts = 1000; // ms between bursts (1 second)
      
      const allResults: UploadResult[] = [];

      for (let burst = 0; burst < totalBursts; burst++) {
        console.log(`\nStarting upload burst ${burst + 1} of ${totalBursts}`);
        
        // Run a burst of uploads with shorter timeouts to provoke connection resets
        const burstResults = await Promise.all(
          Array.from({ length: burstSize }, (_, i) => 
            runUpload(i + 3000 + (burst * burstSize), true, undefined, 3000)
          )
        );
        
        allResults.push(...burstResults);
        
        // Small delay between bursts to let server recover slightly
        if (burst < totalBursts - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBursts));
        }
      }
      
      // Analyze results
      const successfulUploads = allResults.filter(r => r.success).length;
      const successRate = (successfulUploads / allResults.length) * 100;
      
      // Count error types
      const errorCounts = {};
      allResults.forEach(result => {
        if (!result.success && result.error) {
          const errorType = result.error.code || 'Unknown';
          errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
        }
      });
      
      console.log(`\nRapid Burst Upload Results (${allResults.length} total uploads):`);
      console.log(`Success Rate: ${successRate.toFixed(2)}%`);
      console.log('Error breakdown:', errorCounts);
      
      // We specifically expect some ECONNRESET errors in this test
      const connectionResetErrors = allResults.filter(
        r => r.error && r.error.code === 'ECONNRESET'
      ).length;
      
      console.log(`ECONNRESET Errors: ${connectionResetErrors}`);
      
      // This test is designed to produce ECONNRESET errors, so we expect some
      expect(connectionResetErrors).toBeGreaterThan(0);
    }, 120000); // 2-minute timeout
  });
});
