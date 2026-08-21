import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import AttendanceModule from '../dist/models/Attendance.js';

const Attendance = AttendanceModule.default ?? AttendanceModule;

const uri = process.env.MONGODB_TEST_URI;

test('replica-set integration: attendance is unique by company, employee, and business date', { skip: !uri }, async () => {
  await mongoose.connect(uri, { dbName: process.env.MONGODB_TEST_DB || 'vook_integration' });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  assert.ok(hello.setName, 'MONGODB_TEST_URI must point to a replica set');

  const companyId = new mongoose.Types.ObjectId();
  const employeeId = new mongoose.Types.ObjectId();
  const businessDate = '2099-01-01';
  try {
    await Attendance.syncIndexes();
    await Attendance.create({ companyId, employeeId, date: new Date('2099-01-01T00:00:00.000Z'), businessDate, status: 'Present' });
    await assert.rejects(
      Attendance.create({ companyId, employeeId, date: new Date('2099-01-01T00:00:00.000Z'), businessDate, status: 'Late' }),
      (error) => error?.code === 11000,
    );
  } finally {
    await Attendance.deleteMany({ companyId });
    await mongoose.disconnect();
  }
});

test('replica-set integration: transactions are supported', { skip: !uri }, async () => {
  await mongoose.connect(uri, { dbName: process.env.MONGODB_TEST_DB || 'vook_integration' });
  const session = await mongoose.startSession();
  try {
    let committed = false;
    await session.withTransaction(async () => { committed = true; });
    assert.equal(committed, true);
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
});
