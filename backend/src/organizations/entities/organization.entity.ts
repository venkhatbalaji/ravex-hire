// apps/api/src/organizations/entities/organization.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JobPosting } from '../../job-postings/entities/job-posting.entity'; // Placeholder
import { Subscription } from '../../subscriptions/entities/subscription.entity'; // Placeholder

@Entity({ name: 'organizations' })
@Index(['email'], { unique: true })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string; // This will also serve as the tenantId

  @Column()
  name: string;

  @Column({ unique: true }) // Organization's primary contact email
  email: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ default: false }) // To be approved by a super admin
  isApproved: boolean;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true }) // Initially null, set after user is created
  ownerId?: string;

  // Define the owner relation after User entity is also defined.
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) // User might not have `ownedOrganizations` yet.
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @OneToMany(() => JobPosting, jobPosting => jobPosting.organization, { cascade: ['soft-remove', 'recover'] })
  jobPostings: JobPosting[];

  @OneToOne(() => Subscription, subscription => subscription.organization, { cascade: true, nullable: true })
  subscription?: Subscription;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
