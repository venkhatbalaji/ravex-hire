// apps/api/src/core/core.module.ts
import { Module, NestModule, MiddlewareConsumer, Global } from '@nestjs/common';
import { TenantContextService } from './services/tenant-context.service';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
// If TenantContextMiddleware needed to decode JWTs itself:
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule } from '@nestjs/config';

// @Global() // Making CoreModule global can simplify TenantContextService injection
           // but generally, explicit imports are preferred.
           // For request-scoped services like TenantContextService, global is fine.
@Module({
  // imports: [
  //   JwtModule.register({}), // Only if middleware decodes token; needs async config if so
  //   ConfigModule,            // Only if middleware decodes token
  // ],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
