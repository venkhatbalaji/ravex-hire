import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet'; // Ensure this is imported
import rateLimit from 'express-rate-limit'; // Existing import
import RedisStore from 'rate-limit-redis'; // Existing import
import { createClient } from 'redis'; // Existing import
import { LogLevel } from '@nestjs/common'; // For logging levels

async function bootstrap() {
  // Environment-specific logging levels
  const logLevels: LogLevel[] = process.env.NODE_ENV === 'production'
    ? ['log', 'error', 'warn']
    : ['log', 'error', 'warn', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    // Pass logger options to NestFactory
    logger: logLevels,
  });

  const configService = app.get(ConfigService);

  // CORS Configuration
  const corsOrigin = configService.get<string>('CORS_ORIGIN'); // e.g., http://localhost:3001,https://yourdomain.com
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin, // Handle multiple origins
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true, // If you need to send cookies or authorization headers
      // allowedHeaders: 'Content-Type, Accept, Authorization', // Customize as needed
    });
    console.log(`CORS enabled for origin(s): ${corsOrigin}`);
  } else {
    // Fallback or stricter default if CORS_ORIGIN is not set
    app.enableCors(); // Enables CORS with default permissive settings - review for production
    console.log('CORS enabled with default settings (permissive). Set CORS_ORIGIN for production.');
  }

  // Helmet for security headers
  app.use(helmet());
  console.log('Helmet security headers enabled.');

  // Enable graceful shutdown (moved up to be before other middleware if it matters, though typically doesn't)
  app.enableShutdownHooks();

  // Rate Limiting
  const redisHost = configService.get<string>('redis.host', 'localhost');
  const redisPort = configService.get<number>('redis.port', 6379);
  // const redisPassword = configService.get<string>('redis.password'); // Optional

  const redisClient = createClient({
    url: `redis://${redisHost}:${redisPort}`,
    // password: redisPassword,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error for Rate Limiter', err));
  await redisClient.connect().catch(err => console.error('Failed to connect Redis Client for Rate Limiter', err));

  const limiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      // prefix: 'rl:', // Optional
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  });

  app.use(limiter); // Apply rate limiting middleware

  // Swagger (OpenAPI) setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ravex API')
    .setDescription('API documentation for the Ravex Hiring Platform')
    .setVersion('1.0')
    .addTag('API Operations')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name will be used to refer to this security scheme
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api-docs', app, document);

  const port = configService.get<number>('API_PORT') || 3000;

  await app.listen(port, () => {
    // Updated log message
    console.log(`API server listening on port ${port}. Logger levels: ${logLevels.join(', ')}. CORS: ${corsOrigin || 'default'}. Helmet: enabled. Rate limiting: active.`);
  });
}
bootstrap();
