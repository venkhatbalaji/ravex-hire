// apps/api/src/organizations/organizations.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';
// import { UsersModule } from '../users/users.module'; // Not directly needed here if AuthService orchestrates

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    // forwardRef(() => UsersModule), // If OrganizationService needed UsersService directly
  ],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
