import { BaseModel } from '@/base/base.entity';
import { Entity, Column } from 'typeorm';

@Entity()
export class Media extends BaseModel {
  @Column({ default: 'default' })
  collection: string;

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number;
}
