// backend/test/setup-e2e.ts
import { jest } from '@jest/globals';

// In-memory store for our mock Redis
const redisStore = new Map<string, string>();
const clientEmitters = new Map<string, jest.Mock>();

const getEmitter = (clientName: string) => {
  if (!clientEmitters.has(clientName)) {
    clientEmitters.set(clientName, jest.fn());
  }
  return clientEmitters.get(clientName);
};

jest.mock('redis', () => {
  // Create a unique identifier for each client instance for emitter tracking
  let clientInstanceCounter = 0;

  return {
    createClient: jest.fn().mockImplementation(() => {
      const clientName = `client-${clientInstanceCounter++}`;
      const emitter = getEmitter(clientName); // Get or create an emitter for this client instance

      const mockClient = {
        on: jest.fn((event, callback) => {
          // Store the callback to be called manually or by other methods
          emitter.mockImplementation((e, ...args) => {
            if (e === event) {
              callback(...args);
            }
          });
          // console.log(`MockRedis(${clientName}): event listener added for '${event}'`);
          return mockClient; // Allow chaining
        }),
        connect: jest.fn().mockImplementation(() => {
          // console.log(`MockRedis(${clientName}): connect() called`);
          // Simulate successful connection by emitting 'connect'
          // Process.nextTick is used to simulate async behavior
          process.nextTick(() => emitter('connect'));
          return Promise.resolve(mockClient);
        }),
        quit: jest.fn().mockImplementation(() => {
          // console.log(`MockRedis(${clientName}): quit() called`);
          process.nextTick(() => emitter('end'));
          return Promise.resolve('OK');
        }),
        // Mocking sendCommand for rate-limit-redis and potentially connect-redis
        // This is a simplified version. rate-limit-redis sends commands like:
        // ['INCR', key], ['EXPIRE', key, ttl, 'NX'] (NX for v7+), ['TTL', key]
        // connect-redis sends commands like:
        // ['GET', key], ['SET', key, value, 'EX', ttl], ['DEL', key], ['TTL', key]
        sendCommand: jest.fn().mockImplementation(async (args: string[]) => {
          const command = args[0].toUpperCase();
          const key = args[1];
          // console.log(`MockRedis(${clientName}): sendCommand(${command}, ${key}, ...) called with args:`, args);

          switch (command) {
            case 'GET':
              return redisStore.get(key) || null;
            case 'SET': // Used by connect-redis
              // SET key value [EX seconds | PX milliseconds | EXAT unix-time-seconds | PXAT unix-time-milliseconds] [NX | XX] [GET]
              redisStore.set(key, args[2]);
              if (args[3] && args[3].toUpperCase() === 'EX' && args[4]) {
                // Handle EX, but jest.advanceTimersByTime would be needed in tests
                // For simplicity, we'll just set it. TTL handling can be complex here.
              }
              return 'OK';
            case 'DEL':
              redisStore.delete(key);
              return 1; // Number of keys deleted
            case 'INCR': // Used by rate-limit-redis
              {
                const currentValue = parseInt(redisStore.get(key) || '0', 10);
                const newValue = currentValue + 1;
                redisStore.set(key, newValue.toString());
                return newValue;
              }
            case 'EXPIRE': // Used by rate-limit-redis
              // For mock, we don't need to do much with TTL unless testing expiration explicitly
              return 1; // 1 if timeout was set, 0 if key does not exist
            case 'TTL':
              return redisStore.has(key) ? 3600 : -2; // Simulate some TTL or key not existing
            default:
              // console.warn(`MockRedis(${clientName}): Unhandled command ${command}`);
              return null;
          }
        }),
        // For connect-redis v7, it might use specific commands if sendCommand is not robust enough
        // Adding common commands connect-redis might use directly if not through sendCommand
        get: jest.fn(async (key: string) => redisStore.get(key) || null),
        set: jest.fn(async (key: string, value: string, options?: any) => {
          redisStore.set(key, value);
          // Handle options like EX for expiration if needed for tests
          return 'OK';
        }),
        del: jest.fn(async (key: string) => {
          redisStore.delete(key);
          return 1;
        }),
        isOpen: true, // Simulate client is open after connect
        isReady: true, // Simulate client is ready
      };
      return mockClient;
    }),
  };
});

// Helper to clear the mock Redis store before each test or test suite
export const clearRedisStore = () => {
  redisStore.clear();
  clientEmitters.clear();
};

// You might want to call clearRedisStore in a global beforeAll or beforeEach
// in your jest-e2e.json setup or directly in test files.
// For now, it's exported so tests can call it.

beforeEach(() => {
  clearRedisStore();
});
