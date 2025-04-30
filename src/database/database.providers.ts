import { DataSource } from 'typeorm';
import { Media } from '@/media/entities/media.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: 5432,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [Media],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
