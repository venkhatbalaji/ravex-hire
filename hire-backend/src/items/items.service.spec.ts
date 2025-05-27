import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService, CreateItemDto } from './items.service';
import { getModelToken } from '@nestjs/mongoose';
import { Item, ItemDocument, ItemSchema } from './schemas/item.schema'; // Ensure ItemSchema is imported
import { Model } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose'; // Required for forFeature

describe('ItemsService', () => {
  let service: ItemsService;
  let model: Model<ItemDocument>;

  const mockItem = (
    name = 'Test Item',
    tenantId = 'tenant1',
    id = 'a_mongo_id',
  ): Partial<ItemDocument> => ({
    _id: id,
    name,
    tenantId,
    save: jest.fn().mockResolvedValue({ _id: id, name, tenantId }),
  });

  const mockItemModel = {
    new: jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'a_mongo_id', ...dto }),
    })),
    create: jest.fn().mockImplementation((dto) => Promise.resolve({ _id: 'a_mongo_id', ...dto })),
    find: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // It's often better to import MongooseModule directly if you need to use forFeature/forRoot
      // However, providing it via getModelToken is also a common pattern for mocking.
      // For a more integrated test, you might use an in-memory MongoDB.
      imports: [
        // Import MongooseModule to provide the ItemModel correctly if not using a manual mock approach entirely
        // MongooseModule.forRoot('mongodb://localhost/testdb'), // Example in-memory or test DB
        MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
      ],
      providers: [
        ItemsService,
        {
          provide: getModelToken(Item.name),
          useValue: mockItemModel,
        },
      ],
    })
    // Overwrite the compiled model with the mock after module creation if direct import is used
    .overrideProvider(getModelToken(Item.name))
    .useValue(mockItemModel)
    .compile();

    service = module.get<ItemsService>(ItemsService);
    model = module.get<Model<ItemDocument>>(getModelToken(Item.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save an item with the given tenantId', async () => {
      const createItemDto: CreateItemDto = { name: 'New Item' };
      const tenantId = 'tenant-abc';
      const expectedItem = {
        name: createItemDto.name,
        tenantId,
      };

      // We need to ensure the mock for `new this.itemModel()` is correctly set up
      // and its `save` method is also a jest.fn()
      const saveSpy = jest.fn().mockResolvedValue({ _id: 'some_id', ...expectedItem });
      mockItemModel.new.mockImplementationOnce(() => ({
          ...expectedItem,
          save: saveSpy,
      }));
      
      const result = await service.create(createItemDto, tenantId);

      expect(mockItemModel.new).toHaveBeenCalledWith(expectedItem);
      expect(saveSpy).toHaveBeenCalled();
      expect(result.name).toEqual(expectedItem.name);
      expect(result.tenantId).toEqual(expectedItem.tenantId);
    });
  });

  describe('findAllByTenant', () => {
    it('should call itemModel.find with the correct tenantId and return the result', async () => {
      const tenantId = 'tenant-xyz';
      const items = [mockItem('Item 1', tenantId), mockItem('Item 2', tenantId)];
      mockItemModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(items),
      } as any); // Cast to any to satisfy mongoose chain query

      const result = await service.findAllByTenant(tenantId);

      expect(model.find).toHaveBeenCalledWith({ tenantId });
      expect(result).toEqual(items);
    });

     it('should return an empty array if no items are found for the tenant', async () => {
      const tenantId = 'non-existent-tenant';
      mockItemModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.findAllByTenant(tenantId);
      expect(model.find).toHaveBeenCalledWith({ tenantId });
      expect(result).toEqual([]);
    });
  });
});
