// apps/api/src/organizations/organizations.service.ts
import { Injectable, ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
// CreateOrganizationRequestDto will be defined in auth/dto
// import { CreateOrganizationRequestDto } from '../auth/dto/create-organization.dto'; 
import { User } from '../users/entities/user.entity';


@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async createOrganization(
    orgData: { name: string; email: string; contactPhone?: string; address?: string },
    // ownerUser will be associated after creation by the calling service (AuthService)
  ): Promise<Organization> {
    const existingOrgByEmail = await this.organizationsRepository.findOne({ where: { email: orgData.email } });
    if (existingOrgByEmail) {
      this.logger.warn(`Attempt to create organization with existing email: ${orgData.email}`);
      throw new ConflictException(`Organization with email ${orgData.email} already exists.`);
    }
    // Check for name conflict if desired (can be a business rule)
    // const existingOrgByName = await this.organizationsRepository.findOne({ where: { name: orgData.name } });
    // if (existingOrgByName) {
    //   this.logger.warn(`Attempt to create organization with existing name: ${orgData.name}`);
    //   throw new ConflictException(`Organization with name ${orgData.name} already exists.`);
    // }

    const organization = this.organizationsRepository.create({
      name: orgData.name,
      email: orgData.email,
      contactPhone: orgData.contactPhone,
      address: orgData.address,
      isApproved: false, // Default to not approved; super admin can approve
      // owner and ownerId will be set by setOwner method
    });

    try {
      const savedOrg = await this.organizationsRepository.save(organization);
      this.logger.log(`Organization created with ID: ${savedOrg.id}, Name: ${savedOrg.name}`);
      return savedOrg;
    } catch (error) {
      this.logger.error(`Failed to create organization: ${error.message}`, error.stack);
      // Check for unique constraint violation (e.g., if email check somehow missed due to race condition)
      if (error.code === '23505') { // PostgreSQL unique violation code
         this.logger.warn(`Unique constraint violation for email ${orgData.email} or name ${orgData.name}.`);
         throw new ConflictException('Organization with this email or name might already exist.');
      }
      throw new InternalServerErrorException('Could not create organization due to an unexpected error.');
    }
  }

  async findOrganizationById(id: string): Promise<Organization | undefined> {
    return this.organizationsRepository.findOne({ where: { id } });
  }

  async setOwner(organizationId: string, owner: User): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
        this.logger.error(`Organization not found with ID: ${organizationId} when trying to set owner.`);
        throw new NotFoundException(`Organization not found with ID: ${organizationId}`);
    }
    organization.owner = owner;
    organization.ownerId = owner.id; // Explicitly set the foreign key as well
    
    try {
        const updatedOrg = await this.organizationsRepository.save(organization);
        this.logger.log(`Owner ${owner.email} set for organization ${updatedOrg.name} (ID: ${updatedOrg.id})`);
        return updatedOrg;
    } catch (error) {
        this.logger.error(`Failed to set owner for organization ${organizationId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Could not set owner for the organization.');
    }
  }
}
