import { NestFactory } from '@nestjs/core';
import { AppModule } from './module/app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable class-validator globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('RaveX Hire Gateway API')
    .setDescription('API Gateway for Tenant/User/Job Microservices')
    .setVersion('1.0')
    .addTag('tenants')
    .addTag('users')
    .addTag('jobs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`🚀 Gateway running on http://localhost:3000`);
  console.log(`📘 Swagger: http://localhost:3000/api/docs`);
}

bootstrap();
