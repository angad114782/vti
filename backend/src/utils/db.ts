import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vook';
  await mongoose.connect(uri);
  if (process.env.REQUIRE_MONGODB_REPLICA_SET === 'true') {
    const hello = await mongoose.connection.db?.admin().command({ hello: 1 });
    if (!hello?.setName) {
      await mongoose.disconnect();
      throw new Error('MongoDB replica set is required when REQUIRE_MONGODB_REPLICA_SET=true');
    }
  }
  console.log('MongoDB connected');
};

export default connectDB;
