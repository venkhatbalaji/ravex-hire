import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useLogger(app.get(WINSTON_MODULE_PROVIDER));
  const config = app.get(ConfigService);
  const port = config.get('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
