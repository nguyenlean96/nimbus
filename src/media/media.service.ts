import { Inject, Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';

@Injectable()
export class MediaService {
  constructor(
    @Inject('MEDIA_REPOSITORY')
    private mediaRepo: Repository<Media>,
  ) {}

  async create(createMediaDto: CreateMediaDto, file: Express.Multer.File) {
    const savedPath = `/uploads/${file.filename}`;

    const media = this.mediaRepo.create({
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      collection: createMediaDto.collection || 'default',
    });
    
    return this.mediaRepo.save(media);
  }

  findAll() {
    return `This action returns all media`;
  }

  findOne(id: number) {
    return `This action returns a #${id} media`;
  }

  update(id: number, updateMediaDto: UpdateMediaDto) {
    return `This action updates a #${id} media`;
  }

  remove(id: number) {
    return `This action removes a #${id} media`;
  }
}
