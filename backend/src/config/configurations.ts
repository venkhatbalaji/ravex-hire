// apps/api/src/config/configurations.ts
export const appConfig = () => ({
  port: parseInt(process.env.API_PORT, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'defaultSecret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
});

export const databaseConfig = () => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ravex_hiring_dev',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Path to entities
  synchronize: process.env.NODE_ENV !== 'production', // Be cautious with synchronize in prod
  migrationsTableName: 'migrations',
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/database/migrations', // Used by TypeORM CLI to know where to create new migrations
  },
});

export const redisConfig = () => ({
  redis: { // Namespacing Redis configuration
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    // password: process.env.REDIS_PASSWORD, // Uncomment if you have a password
    // ttl: parseInt(process.env.REDIS_TTL_SECONDS, 10) || 3600, // Default TTL for cache entries
  }
});
