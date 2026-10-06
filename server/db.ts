import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoClient: MongoClient | null = null;
let database: Db | null = null;
let memoryServer: MongoMemoryServer | null = null;

export async function getDb(): Promise<Db> {
  if (database) {
    return database;
  }

  let uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[MongoDB] No external MONGODB_URI provided. Initializing in-memory MongoMemoryServer...');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log(`[MongoDB] MongoMemoryServer ready at ${uri}`);
  }

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  database = mongoClient.db('user_access_portal');

  // Create indexes
  await database.collection('users').createIndex({ userId: 1 }, { unique: true });
  await database.collection('records').createIndex({ recordId: 1 }, { unique: true });
  await database.collection('records').createIndex({ ownerId: 1 });
  await database.collection('records').createIndex({ status: 1 });

  return database;
}

export function getMongoClient(): MongoClient {
  if (!mongoClient) {
    throw new Error('MongoClient has not been initialized. Call getDb() first.');
  }
  return mongoClient;
}

export async function closeDb(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    database = null;
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
