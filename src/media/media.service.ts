import { Inject, Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { StorageService } from '@/storage/services/storage.service';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(
    @Inject('MEDIA_REPOSITORY')
    private mediaRepo: Repository<Media>,
    private storageService: StorageService,
  ) {}

  async create(createMediaDto: CreateMediaDto, file: Express.Multer.File) {
    // First save the media entry to get an ID
    const media = this.mediaRepo.create({
      fileName: file.originalname, // Store the original filename
      mimeType: file.mimetype,
      size: file.size,
      collection: createMediaDto.collection || 'default',
    });
    
    // Save to get an ID
    const savedMedia = await this.mediaRepo.save(media);
    
    // Move file from temp location to its permanent location based on ID
    const tmpFilePath = path.join(process.cwd(), file.path);
    const filePath = await this.storageService.moveFileToMediaFolder(
      savedMedia.id,
      savedMedia.collection,
      tmpFilePath,
      savedMedia.fileName,
      savedMedia.mimeType,
    );
    
    // Update the media record with the new file path
    savedMedia.fileName = path.basename(filePath);
    await this.mediaRepo.update(savedMedia.id, { fileName: savedMedia.fileName });
    
    return savedMedia;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [items, total] = await this.mediaRepo.findAndCount({
      skip,
      take: limit,
      order: {
        id: 'DESC' // Most recent first
      }
    });

    const lastPage = Math.ceil(total / limit);
    
    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage,
        hasNextPage: page < lastPage,
        hasPreviousPage: page > 1
      }
    };
  }

  async findOne(id: number) {
    return this.mediaRepo.findOneBy({ id });
  }

  async update(id: number, updateMediaDto: UpdateMediaDto) {
    await this.mediaRepo.update(id, updateMediaDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const media = await this.findOne(id);
    if (!media) {
      return { success: false, message: 'Media not found' };
    }
    
    // Delete all associated files
    await this.storageService.deleteMediaFiles(media.id);
    
    // Delete the database record
    await this.mediaRepo.delete(id);
    
    return { success: true, message: 'Media deleted successfully' };
  }
  
  /**
   * Get the URL to access a media file, optionally specifying a conversion (thumbnail)
   */
  getMediaUrl(media: Media, conversion?: string): string {
    return this.storageService.getMediaUrl(media.id, media.fileName, conversion);
  }
}
