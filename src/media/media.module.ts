import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { DatabaseModule } from '@/database/database.module';
import { mediaProviders } from './media.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [MediaController],
  providers: [...mediaProviders, MediaService],
})
export class MediaModule {}
