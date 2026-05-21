import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri(): string | undefined {
  return (
    process.env.MONGO_STORAGE_MONGODB_URI ?? process.env.MONGODB_URI
  );
}

export function getMongoClient(): Promise<MongoClient> {
  const uri = getMongoUri();
  if (!uri) {
    return Promise.reject(
      new Error(
        "MONGO_STORAGE_MONGODB_URI or MONGODB_URI is not set",
      ),
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  return new MongoClient(uri).connect();
}
