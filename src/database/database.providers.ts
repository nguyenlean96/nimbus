import { DataSource } from 'typeorm';
import { Media } from '@/media/entities/media.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const isProduction = process.env.APP_ENV === 'production';
      
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: 5432,
        database: process.env.DB_DATABASE,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '', // Ensure password is a string
        entities: [Media],
        synchronize: !isProduction, // Only synchronize in non-production environments
      });

      return dataSource.initialize();
    },
  },
];
