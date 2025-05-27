import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from './schemas/item.schema';
import { ItemsService } from './items.service'; // Import ItemsService

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
  ],
  // If you have controllers for this module, declare them here
  // controllers: [ItemsController],
  providers: [ItemsService], // Add ItemsService to providers
  exports: [ItemsService], // Export ItemsService if it needs to be used by other modules
})
export class ItemsModule {}
