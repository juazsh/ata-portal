import mongoose from 'mongoose';
import User from './../models/user';

import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academy-portal';

const options = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let cachedConnection: typeof mongoose | null = null;


declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}


globalThis.mongoose = globalThis.mongoose || { conn: null, promise: null };

export async function connectToDatabase() {
  if (cachedConnection) {
    return { connection: cachedConnection, User };
  }

  if (globalThis.mongoose.conn) {
    return { connection: globalThis.mongoose.conn, User };
  }

  mongoose.set('strictQuery', true);

  if (!globalThis.mongoose.promise) {
    globalThis.mongoose.promise = mongoose.connect(MONGODB_URI, options);
  }

  const connection = await globalThis.mongoose.promise;


  cachedConnection = connection;
  globalThis.mongoose.conn = connection;

  return { connection, User };
}


export { User };