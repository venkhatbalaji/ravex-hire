import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item, ItemDocument } from './schemas/item.schema';

export interface CreateItemDto {
  name: string;
  // tenantId will be added by the service
}

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
  ) {}

  async create(createItemDto: CreateItemDto, tenantId: string): Promise<Item> {
    const newItem = (this.itemModel as any).new({
      ...createItemDto,
      tenantId,
    });
    return newItem.save();
  }

  async findAllByTenant(tenantId: string): Promise<Item[]> {
    return this.itemModel.find({ tenantId }).exec();
  }
}
