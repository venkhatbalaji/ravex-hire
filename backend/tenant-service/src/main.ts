import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './module/app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: 'localhost:5001',
        package: ['tenant', 'user', 'job'],
        protoPath: [
          'src/proto/tenant.proto',
          'src/proto/user.proto',
          'src/proto/job.proto',
        ],
      },
    },
  );
  await app.listen();
}
bootstrap();
