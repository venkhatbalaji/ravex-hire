// apps/api/src/job-postings/entities/job-posting.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity'; // For postedById relation

@Entity({ name: 'job_postings' })
export class JobPosting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Organization, organization => organization.jobPostings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true }) // User who posted the job
  @JoinColumn({ name: 'posted_by_id' })
  postedBy?: User;

  @Column({ name: 'posted_by_id', type: 'uuid', nullable: true })
  postedById?: string;
  
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Add other fields as per the full entity definition from Phase 1 later
  // e.g., location, salaryMin, salaryMax, employmentType, status, expiresAt
}
