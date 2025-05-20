import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore as RateLimitRedisStore } from 'rate-limit-redis';
import { createClient, RedisClientType } from 'redis'; // Import RedisClientType for typing
import { LogLevel, Logger } from '@nestjs/common'; // Import Logger

// Imports for session management
import * as session from 'express-session';
import ConnectRedis from 'connect-redis';

async function bootstrap() {
  const logger = new Logger('Bootstrap'); // Create a logger instance

  const logLevels: LogLevel[] = process.env.NODE_ENV === 'production'
    ? ['log', 'error', 'warn']
    : ['log', 'error', 'warn', 'debug', 'verbose'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels, // Use NestJS built-in logger with specified levels
  });

  const configService = app.get(ConfigService);

  // CORS Configuration
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    logger.log(`CORS enabled for origin(s): ${corsOrigin}`);
  } else {
    app.enableCors();
    logger.warn('CORS enabled with default settings (permissive). Set CORS_ORIGIN for production.');
  }

  app.use(helmet());
  logger.log('Helmet security headers enabled.');

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Redis Client for Rate Limiting
  const rateLimitRedisHost = configService.get<string>('REDIS_HOST_RATE_LIMIT', configService.get<string>('REDIS_HOST', 'localhost'));
  const rateLimitRedisPort = configService.get<number>('REDIS_PORT_RATE_LIMIT', configService.get<number>('REDIS_PORT', 6379));
  const rateLimitRedisPassword = configService.get<string>('REDIS_PASSWORD_RATE_LIMIT', configService.get<string>('REDIS_PASSWORD'));

  const rateLimitRedisClient = createClient({
    url: `redis://${rateLimitRedisHost}:${rateLimitRedisPort}`,
    password: rateLimitRedisPassword || undefined,
  }) as RedisClientType; // Cast for type safety if needed, though createClient is typed
  rateLimitRedisClient.on('error', (err) => logger.error('Redis Client Error for Rate Limiter', err));
  await rateLimitRedisClient.connect().catch(err => logger.error('Failed to connect Redis Client for Rate Limiter', err));
  logger.log('Redis client for rate limiting connected.');

  // Rate Limiting Middleware
  app.use(
    rateLimit({
      store: new RateLimitRedisStore({
        sendCommand: (...args: string[]) => rateLimitRedisClient.sendCommand(args),
      }),
      windowMs: parseInt(configService.get<string>('RATE_LIMIT_WINDOW_MS', (15 * 60 * 1000).toString())),
      max: parseInt(configService.get<string>('RATE_LIMIT_MAX_REQUESTS', '100')),
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, next, options) => {
        // logger.warn(`Rate limit exceeded for IP: ${req.ip}`); // Optional: log rate limit events
        res.status(options.statusCode).json({
          message: `Too many requests from this IP, please try again after ${Math.ceil(options.windowMs / 60000)} minutes.`,
          statusCode: options.statusCode,
          error: "Too Many Requests"
        });
      },
    }),
  );
  logger.log('Rate limiting active with custom handler and configurable limits.');

  // Session Management Redis Client
  const sessionRedisHost = configService.get<string>('REDIS_HOST_SESSION', configService.get<string>('REDIS_HOST', 'localhost'));
  const sessionRedisPort = configService.get<number>('REDIS_PORT_SESSION', configService.get<number>('REDIS_PORT', 6379));
  const sessionRedisPassword = configService.get<string>('REDIS_PASSWORD_SESSION', configService.get<string>('REDIS_PASSWORD'));

  const sessionRedisClient = createClient({
    url: `redis://${sessionRedisHost}:${sessionRedisPort}`,
    password: sessionRedisPassword || undefined,
  }) as RedisClientType; // Cast for type safety
  sessionRedisClient.on('error', (err) => logger.error('Redis Client Error for session store', err));
  await sessionRedisClient.connect().catch(err => {
      logger.error('Failed to connect Redis Client for session store', err);
  });
  logger.log('Redis client for session store connected.');
  
  const RedisStoreInitialized = ConnectRedis(session);

  app.use(
    session({
      store: new RedisStoreInitialized({ client: sessionRedisClient }),
      secret: configService.get<string>('SESSION_SECRET', 'your-default-session-secret-CHANGE-THIS'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: configService.get<string>('NODE_ENV') === 'production',
        httpOnly: true,
        maxAge: parseInt(configService.get<string>('SESSION_MAX_AGE_MS', (24 * 60 * 60 * 1000).toString())),
      },
    }),
  );
  logger.log('Session middleware configured with RedisStore.');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ravex API')
    .setDescription('API documentation for the Ravex Hiring Platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api/docs', app, document);
  logger.log('Swagger UI available at /api/docs.');

  const port = configService.get<number>('API_PORT') || 3000;
  await app.listen(port, () => {
    logger.log(`API server listening on port ${port}. Logger levels: ${logLevels.join(', ')}. CORS: ${corsOrigin || 'default'}. Helmet: enabled. Rate limiting: active. Session store: Redis.`);
  });

  // Graceful shutdown for Redis clients created in main.ts
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, shutting down gracefully...`);
      if (sessionRedisClient && sessionRedisClient.isOpen) {
        await sessionRedisClient.quit();
        logger.log('Session Redis client disconnected.');
      }
      if (rateLimitRedisClient && rateLimitRedisClient.isOpen) {
        await rateLimitRedisClient.quit();
        logger.log('Rate limit Redis client disconnected.');
      }
      await app.close(); // This will trigger onApplicationShutdown in your modules
      logger.log('Application shut down successfully.');
      process.exit(0);
    });
  });
}
bootstrap().catch(err => {
  // Fallback logger if NestJS logger isn't available or fails early
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
