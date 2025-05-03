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
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { localStorageConfig } from '../storage/disks/local.storage';

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
  async findAll() {
    const media = await this.mediaService.findAll();
    
    // Add URLs to each media item
    return media.map(item => ({
      ...item,
      urls: {
        original: this.mediaService.getMediaUrl(item),
        thumb: this.mediaService.getMediaUrl(item, 'thumb'),
        small: this.mediaService.getMediaUrl(item, 'small'),
        medium: this.mediaService.getMediaUrl(item, 'medium'),
        large: this.mediaService.getMediaUrl(item, 'large'),
      }
    }));
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
