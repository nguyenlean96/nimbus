import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { localStorageConfig } from '../storage/disks/local.storage';
import { PaginationDto } from './dto/pagination.dto';

@Controller('api/v1/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', localStorageConfig))
  async create(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const media = await this.mediaService.create(createMediaDto, file);
    
    // Provide URLs for the original and thumbnail versions
    return {
      ...media,
      urls: {
        original: this.mediaService.getMediaUrl(media),
        thumb: this.mediaService.getMediaUrl(media, 'thumb'),
        small: this.mediaService.getMediaUrl(media, 'small'),
        medium: this.mediaService.getMediaUrl(media, 'medium'),
        large: this.mediaService.getMediaUrl(media, 'large'),
      }
    };
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    // Use default values if not provided
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const result = await this.mediaService.findAll(page, limit);
    
    // Add URLs to each media item
    const mediaWithUrls = result.data.map(item => ({
      ...item,
      urls: {
        original: this.mediaService.getMediaUrl(item),
        thumb: this.mediaService.getMediaUrl(item, 'thumb'),
        small: this.mediaService.getMediaUrl(item, 'small'),
        medium: this.mediaService.getMediaUrl(item, 'medium'),
        large: this.mediaService.getMediaUrl(item, 'large'),
      }
    }));
    
    return {
      data: mediaWithUrls,
      meta: result.meta,
      links: {
        first: `api/v1/media?page=1&limit=${limit}`,
        previous: result.meta.hasPreviousPage ? `api/v1/media?page=${page - 1}&limit=${limit}` : null,
        next: result.meta.hasNextPage ? `api/v1/media?page=${page + 1}&limit=${limit}` : null,
        last: `api/v1/media?page=${result.meta.lastPage}&limit=${limit}`
      }
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const media = await this.mediaService.findOne(+id);
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
    
    return {
      ...media,
      urls: {
        original: this.mediaService.getMediaUrl(media),
        thumb: this.mediaService.getMediaUrl(media, 'thumb'),
        small: this.mediaService.getMediaUrl(media, 'small'),
        medium: this.mediaService.getMediaUrl(media, 'medium'),
        large: this.mediaService.getMediaUrl(media, 'large'),
      }
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(+id, updateMediaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }
}
