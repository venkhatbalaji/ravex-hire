// apps/api/src/organizations/organizations.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Repository } from 'typeorm';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '../users/entities/user.entity';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationRepositoryMock: Partial<Repository<Organization>>;

  const mockOrgData = { name: 'Test Org', email: 'org@test.com' };
  const mockOrganization: Organization = {
    id: 'org-uuid-1',
    name: 'Test Org',
    email: 'org@test.com',
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    jobPostings: [],
    // owner, ownerId, subscription might be undefined/null initially
  };
  const mockOwner: User = {
    id: 'user-uuid-owner',
    email: 'owner@test.com',
    role: UserRole.ORGANIZATION_ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownedOrganizations: [],
  };


  beforeEach(async () => {
    organizationRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn().mockReturnValue(mockOrganization), // Assume create returns the entity passed to save
      save: jest.fn().mockResolvedValue(mockOrganization),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: organizationRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrganization', () => {
    it('should successfully create an organization', async () => {
      (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(null); // No existing org with email

      const result = await service.createOrganization(mockOrgData);

      expect(result).toEqual(mockOrganization);
      expect(organizationRepositoryMock.findOne).toHaveBeenCalledWith({ where: { email: mockOrgData.email } });
      expect(organizationRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        name: mockOrgData.name,
        email: mockOrgData.email,
        isApproved: false,
      }));
      expect(organizationRepositoryMock.save).toHaveBeenCalledWith(mockOrganization);
    });

    it('should throw ConflictException if organization email already exists', async () => {
      (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(mockOrganization); // Org with email exists

      await expect(service.createOrganization(mockOrgData)).rejects.toThrow(ConflictException);
      expect(organizationRepositoryMock.findOne).toHaveBeenCalledWith({ where: { email: mockOrgData.email } });
    });
    
    it('should throw ConflictException on unique constraint violation during save', async () => {
        (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(null); // Email check passes initially
        (organizationRepositoryMock.save as jest.Mock).mockRejectedValue({ code: '23505' }); // Simulate DB unique constraint error

        await expect(service.createOrganization(mockOrgData)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on other save errors', async () => {
        (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
        (organizationRepositoryMock.save as jest.Mock).mockRejectedValue(new Error('Some other DB error'));

        await expect(service.createOrganization(mockOrgData)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOrganizationById', () => {
    it('should return organization if found', async () => {
        (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(mockOrganization);
        const result = await service.findOrganizationById('org-uuid-1');
        expect(result).toEqual(mockOrganization);
        expect(organizationRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: 'org-uuid-1' }});
    });

    it('should return undefined if organization not found', async () => {
        (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
        const result = await service.findOrganizationById('non-existent-uuid');
        expect(result).toBeUndefined();
    });
  });
  
  describe('setOwner', () => {
    it('should successfully set the owner of an organization', async () => {
      const orgToUpdate = { ...mockOrganization, owner: null, ownerId: null };
      (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(orgToUpdate);
      
      // Mock that save operation will return the org with owner info
      const updatedOrgWithOwner = { ...orgToUpdate, owner: mockOwner, ownerId: mockOwner.id };
      (organizationRepositoryMock.save as jest.Mock).mockResolvedValue(updatedOrgWithOwner);

      const result = await service.setOwner('org-uuid-1', mockOwner);

      expect(organizationRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: 'org-uuid-1' } });
      expect(organizationRepositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'org-uuid-1',
        owner: mockOwner,
        ownerId: mockOwner.id,
      }));
      expect(result.owner).toEqual(mockOwner);
      expect(result.ownerId).toEqual(mockOwner.id);
    });

    it('should throw NotFoundException if organization to set owner for is not found', async () => {
      (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.setOwner('non-existent-uuid', mockOwner)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if saving fails during setOwner', async () => {
        (organizationRepositoryMock.findOne as jest.Mock).mockResolvedValue(mockOrganization);
        (organizationRepositoryMock.save as jest.Mock).mockRejectedValue(new Error("DB save failed"));
        await expect(service.setOwner('org-uuid-1', mockOwner)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
