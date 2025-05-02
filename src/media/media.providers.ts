import { DataSource } from 'typeorm';
import { Media } from './entities/media.entity';

export const mediaProviders = [
  {
    provide: 'MEDIA_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Media),
    inject: ['DATA_SOURCE'],
  },
];