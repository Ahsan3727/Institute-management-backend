import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://Ahsan3727:%23Ahsan3145673727@ac-75haq23-shard-00-00.slngj0l.mongodb.net:27017,ac-75haq23-shard-00-01.slngj0l.mongodb.net:27017,ac-75haq23-shard-00-02.slngj0l.mongodb.net:27017/institute_management?ssl=true&replicaSet=atlas-oi643h-shard-0&authSource=admin&appName=jewellerycalc';

const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
