import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as sharp from 'sharp';

interface ThumbnailSize {
  name: string;
  width: number;
  height?: number;
}

@Injectable()
export class StorageService {
  private readonly basePath = './storage/public';
  private readonly thumbnailSizes: ThumbnailSize[] = [
    { name: 'thumb', width: 150 },
    { name: 'small', width: 300 },
    { name: 'medium', width: 600 },
    { name: 'large', width: 1200 },
  ];

  /**
   * Move a file from the temporary upload location to its permanent location
   * organized by media ID and generate thumbnails if it's an image
   */
  async moveFileToMediaFolder(
    mediaId: number,
    collection: string,
    tmpFilePath: string,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    // Create directory structure: storage/public/{mediaId}
    const mediaDir = path.join(this.basePath, mediaId.toString());
    await fs.ensureDir(mediaDir);

    // Determine the file destination path
    const destFilePath = path.join(mediaDir, 'original_' + fileName);
    
    // Move the file from tmp to the media directory
    await fs.move(tmpFilePath, destFilePath, { overwrite: true });

    // If it's an image, generate thumbnails
    if (this.isImage(mimeType)) {
      await this.generateThumbnails(mediaDir, destFilePath, fileName);
    }

    // Return the relative path to the file (from the storage/public directory)
    return path.join(mediaId.toString(), 'original_' + fileName);
  }

  /**
   * Get the URL for a specific media file or conversion
   */
  getMediaUrl(mediaId: number, fileName: string, conversion?: string): string {
    if (conversion) {
      const fileNameWithoutExt = path.parse(fileName).name;
      const fileExt = path.parse(fileName).ext;
      return `/storage/${mediaId}/${conversion}_${fileNameWithoutExt}${fileExt}`;
    }
    return `/storage/${mediaId}/original_${fileName}`;
  }

  /**
   * Generate thumbnails for images
   */
  private async generateThumbnails(
    mediaDir: string,
    originalFilePath: string,
    fileName: string,
  ): Promise<void> {
    const fileNameWithoutExt = path.parse(fileName).name;
    const fileExt = path.parse(fileName).ext;

    // Process each thumbnail size
    for (const size of this.thumbnailSizes) {
      const thumbnailPath = path.join(
        mediaDir,
        `${size.name}_${fileNameWithoutExt}${fileExt}`,
      );

      await sharp(originalFilePath)
        .resize({
          width: size.width,
          height: size.height,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(thumbnailPath);
    }
  }

  /**
   * Check if a file is an image based on mimetype
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Remove all files associated with a media item
   */
  async deleteMediaFiles(mediaId: number): Promise<void> {
    const mediaDir = path.join(this.basePath, mediaId.toString());
    if (await fs.pathExists(mediaDir)) {
      await fs.remove(mediaDir);
    }
  }
}