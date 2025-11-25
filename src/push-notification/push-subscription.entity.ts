import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Admin } from '../admin/admin.entity';

@Entity({ schema: 'down-detector', name: 'push_subscriptions' })
@Unique(['adminId', 'endpoint'])
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('jsonb')
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  @Column({ name: 'admin_id' })
  adminId: number;

  @Column({ name: 'endpoint' })
  endpoint: string;

  @ManyToOne(() => Admin)
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}