// apps/api/ormconfig.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { databaseConfig } from './src/config/configurations'; // Path relative to apps/api

// Load environment variables from .env.development.local at the root of the 'api' app
dotenv.config({ path: './.env.development.local' }); // Assuming .env is in the same dir as ormconfig.ts (apps/api)

const dbConfigFromFunction = databaseConfig(); // Get the config object

// For TypeORM 0.3.x (DataSource)
// Ensure paths are correct for CLI context.
// The paths __dirname + '...' might work if ts-node compiles to dist and CLI runs from dist,
// or if paths are correctly resolved by tsconfig-paths.
// Using paths relative to the project root (e.g., 'apps/api/src/...') can be more reliable with Nx.
// However, to match `databaseConfig` from `configurations.ts` which uses `__dirname`, I'll keep it similar.
// This part is highly dependent on the actual build output and CLI execution context.
export default new DataSource({
  type: dbConfigFromFunction.type as 'postgres', // Type assertion
  host: dbConfigFromFunction.host,
  port: dbConfigFromFunction.port,
  username: dbConfigFromFunction.username,
  password: dbConfigFromFunction.password,
  database: dbConfigFromFunction.database,
  entities: dbConfigFromFunction.entities, // Reuse from configurations.ts
  migrationsTableName: dbConfigFromFunction.migrationsTableName,
  migrations: dbConfigFromFunction.migrations, // Reuse from configurations.ts
  synchronize: false, // NEVER true for production or when using migrations
});
