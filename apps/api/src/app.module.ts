// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule as AppConfigModule } from './config.module'; 
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module'; 
import { AuthModule } from './auth/auth.module'; 
import { OrganizationsModule } from './organizations/organizations.module'; 
import { CoreModule } from './core/core.module'; 
import { JobPostingsModule } from './job-postings/job-postings.module'; // Import the new JobPostingsModule
import { AppCacheModule } from './cache/cache.module'; // Import the AppCacheModule
// Placeholder for future modules - these will be created in subsequent tasks
// import { CandidatesModule } from './candidates/candidates.module';
// import { ApplicationsModule } from './applications/applications.module';
// import { SubscriptionsModule } from './subscriptions/subscriptions.module';
// import { PaymentModule } from './payment/payment.module';
// import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    AppConfigModule, 
    DatabaseModule,
    CoreModule, 
    UsersModule, 
    AuthModule, 
    OrganizationsModule, 
    JobPostingsModule, // Add JobPostingsModule here
    AppCacheModule, // Add the AppCacheModule
    // CandidatesModule,
    // ApplicationsModule,
    // SubscriptionsModule,
    // PaymentModule,
    // AdminModule,
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}
