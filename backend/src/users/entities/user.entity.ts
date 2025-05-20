// apps/api/src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn, Index, OneToMany } from 'typeorm';
// Assuming these paths are correct relative to this file for an Nx structure
// The actual entities from previous task were minimal placeholders.
// We will ensure these files exist with at least an ID for relation mapping.
import { Organization } from '../../organizations/entities/organization.entity';
import { CandidateProfile } from '../../candidates/entities/candidate-profile.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  CANDIDATE = 'candidate',
}

@Entity({ name: 'users' }) // Explicitly naming the table
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true }) // Password will be set by AuthService after hashing
  password?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, organization => organization.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
  
  // For quickly finding the organization an admin owns, inverse of Organization.owner
  @OneToMany(() => Organization, organization => organization.owner)
  ownedOrganizations: Organization[];

  // This side is inverse. CandidateProfile is the owner due to @JoinColumn there.
  @OneToOne(() => CandidateProfile, candidateProfile => candidateProfile.user, { cascade: true, nullable: true })
  candidateProfile?: CandidateProfile;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
