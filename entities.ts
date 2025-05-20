import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';

// --- Enums ---

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  CANDIDATE = 'CANDIDATE',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
}

export enum JobPostingStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DRAFT = 'DRAFT',
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  REVIEWING = 'REVIEWING',
  INTERVIEWING = 'INTERVIEWING',
  OFFERED = 'OFFERED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC_MONTHLY = 'BASIC_MONTHLY',
  PREMIUM_MONTHLY = 'PREMIUM_MONTHLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
}

// --- Entities ---

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Serves as tenantId

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  email: string; // Contact email for the organization

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ default: false })
  isApproved: boolean;

  @ManyToOne(() => User, (user) => user.ownedOrganizations, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => JobPosting, (jobPosting) => jobPosting.organization, { cascade: ['remove'] })
  jobPostings: JobPosting[];

  @OneToOne(() => Subscription, (subscription) => subscription.organization, { cascade: ['remove'], nullable: true })
  subscription?: Subscription;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string; // Nullable if using OAuth or similar

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, (organization) => organization.users, {
    nullable: true,
    onDelete: 'SET NULL', // Or 'RESTRICT' if an org admin cannot exist without an org
  })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;
  
  // For quickly finding the organization an admin owns
  @OneToMany(() => Organization, organization => organization.owner)
  ownedOrganizations: Organization[];


  @OneToOne(() => CandidateProfile, (candidateProfile) => candidateProfile.user, { cascade: ['remove'], nullable: true })
  candidateProfile?: CandidateProfile;

  @OneToMany(() => JobPosting, (jobPosting) => jobPosting.postedBy)
  jobPostings: JobPosting[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


@Entity('job_postings')
@Index(['organizationId'])
export class JobPosting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  location: string;

  @Column({ type: 'decimal', nullable: true })
  salaryMin?: number;

  @Column({ type: 'decimal', nullable: true })
  salaryMax?: number;

  @Column({
    type: 'enum',
    enum: EmploymentType,
  })
  employmentType: EmploymentType;

  @Column({
    type: 'enum',
    enum: JobPostingStatus,
    default: JobPostingStatus.DRAFT,
  })
  status: JobPostingStatus;

  @Column({ type: 'uuid' })
  organizationId: string; // Tenant ID

  @ManyToOne(() => Organization, (organization) => organization.jobPostings, {
    nullable: false,
    onDelete: 'CASCADE', // If organization is deleted, delete its job postings
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => Application, (application) => application.jobPosting, { cascade: ['remove'] })
  applications: Application[];

  @Column({ type: 'uuid'})
  postedById: string;

  @ManyToOne(() => User, (user) => user.jobPostings, {
    nullable: false,
    onDelete: 'RESTRICT', // Don't delete job posting if user is deleted, assign to a default/admin user or handle differently
  })
  @JoinColumn({ name: 'postedById' })
  postedBy: User;

  @Column({ default: false })
  freeTierUsage: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;
}

@Entity('candidate_profiles')
@Index(['userId'], { unique: true })
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.candidateProfile, {
    nullable: false,
    onDelete: 'CASCADE', // If User is deleted, CandidateProfile is also deleted
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  headline?: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ nullable: true })
  resumeUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  skills?: string[];

  @Column({ nullable: true })
  portfolioUrl?: string;

  @Column({ nullable: true })
  linkedInUrl?: string;

  @OneToMany(() => Application, (application) => application.candidateProfile)
  applications: Application[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('applications')
@Index(['jobPostingId'])
@Index(['candidateProfileId'])
@Index(['organizationId']) // For tenant-based filtering
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  jobPostingId: string;

  @ManyToOne(() => JobPosting, (jobPosting) => jobPosting.applications, {
    nullable: false,
    onDelete: 'CASCADE', // If JobPosting deleted, delete application
  })
  @JoinColumn({ name: 'jobPostingId' })
  jobPosting: JobPosting;

  @Column({ type: 'uuid' })
  candidateProfileId: string;

  @ManyToOne(() => CandidateProfile, (candidateProfile) => candidateProfile.applications, {
    nullable: false,
    onDelete: 'CASCADE', // If CandidateProfile deleted, delete application
  })
  @JoinColumn({ name: 'candidateProfileId' })
  candidateProfile: CandidateProfile;

  @Column({ type: 'uuid' }) // Denormalized from JobPosting for easier querying
  organizationId: string; 

  // This relation is primarily for making it easier to join/query based on organizationId
  // without going through jobPosting -> organization every time.
  // It assumes organizationId on Application is always set correctly based on JobPosting.
  @ManyToOne(() => Organization, { 
    nullable: false, 
    onDelete: 'CASCADE' // If organization is deleted, applications tied to it are also deleted.
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  coverLetter?: string;

  @CreateDateColumn() // Default: now behavior
  appliedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('subscriptions')
@Index(['organizationId'], { unique: true })
@Index(['stripeSubscriptionId'], { unique: true, where: "stripeSubscriptionId IS NOT NULL" })
@Index(['stripeCustomerId'], { unique: true, where: "stripeCustomerId IS NOT NULL" })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  organizationId: string;

  @OneToOne(() => Organization, (organization) => organization.subscription, {
    nullable: false,
    onDelete: 'CASCADE', // If organization is deleted, its subscription is also deleted
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ unique: true, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ unique: true, nullable: true })
  stripeCustomerId?: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart?: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEnd?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
