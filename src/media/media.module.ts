import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { DatabaseModule } from '@/database/database.module';
import { mediaProviders } from './media.providers';
import { StorageModule } from '@/storage/storage.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [MediaController],
  providers: [...mediaProviders, MediaService],
})
export class MediaModule {}
