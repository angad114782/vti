import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vook';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

export default connectDB;
