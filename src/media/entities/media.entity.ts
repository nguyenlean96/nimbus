import { BaseModel } from '@/base/base.entity';
import { Entity, Column, Generated } from 'typeorm';

@Entity()
export class Media extends BaseModel {
  // A UUID field for external references or unique identification outside the 
  // database.
  @Column()
  @Generated('uuid')
  uuid: string;
  
  @Column({ default: 'default' })
  collection: string;

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number;
}
