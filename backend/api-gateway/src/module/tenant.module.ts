import { Module } from '@nestjs/common';
import { TenantService } from '../service/tenant.service';
import { TenantController } from '../controller/tenant.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TENANT_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'tenant',
          protoPath: 'src/proto/tenant.proto',
          url: 'localhost:5001',
        },
      },
    ]),
  ],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}
