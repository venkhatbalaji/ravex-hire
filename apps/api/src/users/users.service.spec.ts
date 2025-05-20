// apps/api/src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepositoryMock: Partial<Repository<User>>;

  const mockUserData = {
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.CANDIDATE,
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
  };

  const mockUser: User = {
    id: 'user-uuid-1',
    ...mockUserData,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownedOrganizations: [], // Assuming this is part of the User entity
  };

  beforeEach(async () => {
    userRepositoryMock = {
      create: jest.fn().mockReturnValue(mockUser), // Assume create just maps data to entity structure
      save: jest.fn().mockResolvedValue(mockUser),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserInternal', () => {
    it('should successfully create a user', async () => {
      const result = await service.createUserInternal(mockUserData);
      expect(result).toEqual(mockUser);
      expect(userRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining(mockUserData));
      expect(userRepositoryMock.save).toHaveBeenCalledWith(mockUser);
    });
    
    it('should set isActive to true by default if not provided', async () => {
        const userDataWithoutIsActive = { ...mockUserData, isActive: undefined };
        const expectedUserDataWithIsActive = { ...userDataWithoutIsActive, isActive: true };
        (userRepositoryMock.create as jest.Mock).mockReturnValueOnce(expectedUserDataWithIsActive as User);
        (userRepositoryMock.save as jest.Mock).mockResolvedValueOnce(expectedUserDataWithIsActive as User);

        const result = await service.createUserInternal(userDataWithoutIsActive);
        
        expect(userRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining(expectedUserDataWithIsActive));
        expect(result.isActive).toBe(true);
    });
  });

  describe('findUserByEmail', () => {
    it('should return user if found by email', async () => {
      (userRepositoryMock.findOne as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.findUserByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return undefined if user not found by email', async () => {
      (userRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.findUserByEmail('unknown@example.com');
      expect(result).toBeUndefined();
    });
  });

  describe('findUserById', () => {
    it('should return user if found by ID', async () => {
      (userRepositoryMock.findOne as jest.Mock).mockResolvedValue(mockUser);
      const result = await service.findUserById('user-uuid-1');
      expect(result).toEqual(mockUser);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: 'user-uuid-1' } });
    });

    it('should return undefined if user not found by ID', async () => {
      (userRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.findUserById('unknown-uuid');
      expect(result).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const updates: Partial<User> = { firstName: 'UpdatedFirst' };
      const updatedUser = { ...mockUser, ...updates };
      (userRepositoryMock.findOne as jest.Mock).mockResolvedValue(mockUser); // For findUserById
      (userRepositoryMock.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-uuid-1', updates);
      expect(result).toEqual(updatedUser);
      expect(userRepositoryMock.save).toHaveBeenCalledWith(expect.objectContaining(updates));
    });

    it('should throw NotFoundException if user to update is not found', async () => {
      (userRepositoryMock.findOne as jest.Mock).mockResolvedValue(null); // For findUserById
      await expect(service.updateUser('unknown-uuid', { firstName: 'UpdatedFirst' })).rejects.toThrow(NotFoundException);
    });
  });
});
