import {
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
} from 'typeorm';

export abstract class BaseModel {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;
}

export abstract class BaseModelWithSoftDelete extends BaseModel {
	@DeleteDateColumn()
	deleted_at: Date;
}