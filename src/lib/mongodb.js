import mongoose from 'mongoose';

// SECURITY: There is intentionally no hardcoded fallback connection string.
// The previous version of this file shipped a live Atlas credential in the
// repo (and therefore in the deployed serverless bundle). That credential
// must be rotated in Atlas — deleting this fallback does not undo the
// exposure on its own. See Remediation-Plan.md Phase 0.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI environment variable is not set. Add it to .env.local for ' +
      'local development, or to your Vercel project\'s Environment Variables ' +
      'for deployments. Refusing to start with no configured database.'
  );
}

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
