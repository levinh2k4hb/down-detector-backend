import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'down-detector', name: 'admins' })
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column()
  email: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
