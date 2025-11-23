import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'down-detector', name: 'websites' })
export class Website {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  domain: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
