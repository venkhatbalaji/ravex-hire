// apps/api/src/job-postings/job-postings.service.ts (Illustrative example)
import { Injectable, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPosting } from './entities/job-posting.entity'; 
import { TenantContextService } from '../../core/services/tenant-context.service'; 
import { UserRole } from '../../users/entities/user.entity';

// Placeholder DTO
export class CreateJobPostingDto {
  title: string;
  description: string;
  // other fields...
}

@Injectable()
export class JobPostingsService {
  private readonly logger = new Logger(JobPostingsService.name);

  constructor(
    @InjectRepository(JobPosting)
    private jobPostingsRepository: Repository<JobPosting>,
    private readonly tenantContext: TenantContextService, // Inject context
  ) {}

  async create(createJobPostingDto: CreateJobPostingDto): Promise<JobPosting> {
    const organizationId = this.tenantContext.organizationId;
    const userId = this.tenantContext.userId; // User who is creating the post

    if (!organizationId) {
      this.logger.error('Attempted to create job posting without organization context.');
      throw new UnauthorizedException('Organization context is required to create a job posting.');
    }
    if (!userId) {
        this.logger.error('Attempted to create job posting without user context.');
        throw new UnauthorizedException('User context is required to create a job posting.');
    }

    const newPosting = this.jobPostingsRepository.create({
      ...createJobPostingDto,
      organizationId: organizationId, // Set tenant ID
      postedById: userId, // Set creator
      // ensure other required fields like status are set if they are not nullable
    });
    this.logger.log(`Creating job posting for organization ID: ${organizationId} by user ID: ${userId}`);
    return this.jobPostingsRepository.save(newPosting);
  }

  async findAllForCurrentOrganization(): Promise<JobPosting[]> {
    const organizationId = this.tenantContext.organizationId;
    const userRole = this.tenantContext.userRole;

    if (userRole === UserRole.SUPER_ADMIN && !organizationId) {
        this.logger.log('Super admin fetching all job postings across organizations.');
        return this.jobPostingsRepository.find(); // Super admin can see all if no specific orgId in context
    }

    if (!organizationId) {
      this.logger.warn('No organizationId found in context for findAllForCurrentOrganization.');
      return []; // Or throw error, depending on desired behavior
    }
    this.logger.log(`Fetching job postings for organization ID: ${organizationId}`);
    return this.jobPostingsRepository.find({ where: { organizationId } });
  }

  async findOneByIdForCurrentOrganization(id: string): Promise<JobPosting | null> {
    const organizationId = this.tenantContext.organizationId;
    if (!organizationId) {
        // Allow SUPER_ADMIN to fetch any job by ID if needed, or require org context
        if (this.tenantContext.userRole === UserRole.SUPER_ADMIN) {
             this.logger.log(`Super admin fetching job posting by ID: ${id} without org context.`);
             const posting = await this.jobPostingsRepository.findOne({ where: { id }});
             if (!posting) throw new NotFoundException(`Job posting with ID ${id} not found.`);
             return posting;
        }
        this.logger.warn(`No organizationId found in context for findOneByIdForCurrentOrganization (ID: ${id}).`);
        throw new UnauthorizedException('Organization context is required.');
    }
    this.logger.log(`Fetching job posting by ID: ${id} for organization ID: ${organizationId}`);
    const posting = await this.jobPostingsRepository.findOne({ where: { id, organizationId } });
    if (!posting) {
        throw new NotFoundException(`Job posting with ID ${id} not found in your organization.`);
    }
    return posting;
  }
}
