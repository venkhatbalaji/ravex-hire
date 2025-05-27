import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useLogger(app.get(WINSTON_MODULE_PROVIDER));
  await app.listen(3000);
}
bootstrap();
