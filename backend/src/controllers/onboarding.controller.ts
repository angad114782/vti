import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import Plan from '../models/Plan';
import User from '../models/User';
import Payment from '../models/Payment';
import PendingRegistration from '../models/PendingRegistration';
import { withTransaction } from '../utils/transaction';
import { provisionCompany } from '../services/provisionCompany';

const email = (value: string) => value.trim().toLowerCase();
const razorpay = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID ?? '', key_secret: process.env.RAZORPAY_KEY_SECRET ?? '' });

export const publicPlans = async (_req: Request, res: Response) => { res.json(await Plan.find({ isActive: true }).sort({ price: 1 }).select('name type price maxUsers features').lean()); };

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !process.env.SMTP_HOST || !process.env.SMTP_FROM || !process.env.CLIENT_URL) { res.status(503).json({ message: 'Online payments and verification email are not configured yet' }); return; }
    await PendingRegistration.updateMany({ status: 'PENDING_PAYMENT', expiresAt: { $lte: new Date() } }, { $set: { status: 'EXPIRED' } });
    const { company, admin, plan: planType } = req.body;
    const adminEmail = email(admin.email);
    if (await User.exists({ email: adminEmail })) { res.status(409).json({ message: 'An account with this email already exists' }); return; }
    const plan = await Plan.findOne({ type: planType, isActive: true }).lean();
    if (!plan) { res.status(400).json({ message: 'Selected plan is not available' }); return; }
    const passwordHash = await bcrypt.hash(admin.password, 12);
    const registration = await PendingRegistration.create({ company: { ...company, email: company.email ? email(company.email) : undefined }, admin: { name: admin.name.trim(), email: adminEmail, passwordHash }, planId: plan._id, plan: plan.type, amount: plan.price, expiresAt: new Date(Date.now() + 30 * 60_000) });
    const order: any = await razorpay().orders.create({ amount: Math.round(plan.price * 100), currency: 'INR', receipt: `reg_${registration._id.toString().slice(-16)}`, notes: { registrationId: registration._id.toString(), plan: plan.type } });
    await Payment.create({ registrationId: registration._id, source: 'RAZORPAY', status: 'PENDING', plan: plan.type, amount: plan.price, razorpayOrderId: order.id });
    res.status(201).json({ registrationId: registration._id, orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Unable to start checkout' }); }
};

export const checkoutStatus = async (req: Request, res: Response): Promise<void> => {
  await PendingRegistration.updateOne({ _id: req.params.id, status: 'PENDING_PAYMENT', expiresAt: { $lte: new Date() } }, { $set: { status: 'EXPIRED' } });
  const payment = await Payment.findOne({ registrationId: req.params.id }).lean();
  if (!payment) { res.status(404).json({ message: 'Checkout not found' }); return; }
  res.json({ status: payment.status, registrationId: req.params.id });
};

export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.header('x-razorpay-signature') ?? '';
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = req.body as Buffer;
    const digest = crypto.createHmac('sha256', secret ?? '').update(body).digest('hex');
    if (!secret || !signature || signature.length !== digest.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) { res.status(400).json({ message: 'Invalid webhook signature' }); return; }
    const event = JSON.parse(body.toString());
    if (!['payment.captured', 'payment.failed'].includes(event.event)) { res.json({ ok: true }); return; }
    const paymentId = event.payload.payment.entity.id as string;
    const orderId = event.payload.payment.entity.order_id as string;
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment || payment.get('razorpayPaymentId')) { res.json({ ok: true }); return; }
    if (event.event === 'payment.failed') { await Payment.updateOne({ _id: payment._id }, { status: 'FAILED', razorpayPaymentId: paymentId }); res.json({ ok: true }); return; }
    if (Number(event.payload.payment.entity.amount) !== Math.round(Number(payment.get('amount')) * 100)) { await Payment.updateOne({ _id: payment._id }, { status: 'FAILED', razorpayPaymentId: paymentId, notes: 'Gateway amount mismatch' }); res.status(400).json({ message: 'Payment amount mismatch' }); return; }
    let verificationEmail: { to: string; token: string } | null = null;
    await withTransaction(async (session) => {
      const registration = await PendingRegistration.findById(payment.get('registrationId')).session(session);
      if (!registration || registration.get('status') !== 'PENDING_PAYMENT') return;
      const plan = await Plan.findById(registration.get('planId')).session(session).lean();
      if (!plan) throw new Error('Plan not found');
      const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 1);
      const provisioned = await provisionCompany({ company: registration.get('company') as any, admin: registration.get('admin') as any, plan, expiry, adminActive: false }, session);
      await Payment.updateOne({ _id: payment._id }, { $set: { companyId: provisioned.company._id, subscriptionId: provisioned.subscription._id, status: 'PAID', paidAt: new Date(), razorpayPaymentId: paymentId } }, { session });
      const token = crypto.randomBytes(32).toString('hex');
      await PendingRegistration.updateOne({ _id: registration._id }, { $set: { status: 'PAID', verificationTokenHash: crypto.createHash('sha256').update(token).digest('hex'), verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60_000) } }, { session });
      verificationEmail = { to: registration.get('admin.email'), token };
    });
    const pendingVerificationEmail = verificationEmail as { to: string; token: string } | null;
    if (pendingVerificationEmail) {
      try { await sendVerificationEmail(pendingVerificationEmail.to, pendingVerificationEmail.token); }
      catch (emailError) { console.error('Payment committed but verification email failed:', emailError); }
    }
    res.json({ ok: true });
  } catch (err) { console.error('Razorpay webhook error', err); res.status(500).json({ message: 'Webhook processing failed' }); }
};

export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const registration = await PendingRegistration.findOne({ _id: req.params.id, status: 'PAID', verifiedAt: { $exists: false } });
    if (!registration) { res.status(404).json({ message: 'Paid registration not found or already verified' }); return; }
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM || !process.env.CLIENT_URL) { res.status(503).json({ message: 'Email delivery is not configured' }); return; }
    const token = crypto.randomBytes(32).toString('hex');
    await PendingRegistration.updateOne({ _id: registration._id }, { $set: { verificationTokenHash: crypto.createHash('sha256').update(token).digest('hex'), verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60_000) } });
    await sendVerificationEmail(registration.get('admin.email'), token);
    res.json({ message: 'Verification email sent' });
  } catch (err) { console.error('Verification email resend failed:', err); res.status(503).json({ message: 'Could not send verification email' }); }
};

async function sendVerificationEmail(to: string, token: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM || !process.env.CLIENT_URL) return;
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject: 'Verify your Vook account', text: `Verify your email: ${process.env.CLIENT_URL}/verify-email?token=${token}` });
}

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const registration = await PendingRegistration.findOne({ verificationTokenHash: hash, verificationExpiresAt: { $gt: new Date() }, verifiedAt: { $exists: false } });
  if (!registration) { res.status(400).json({ message: 'Invalid or expired verification link' }); return; }
  await PendingRegistration.updateOne({ _id: registration._id }, { $set: { verifiedAt: new Date() }, $unset: { verificationTokenHash: 1, verificationExpiresAt: 1 } });
  await User.updateOne({ email: registration.get('admin.email'), role: 'COMPANY_ADMIN' }, { $set: { isActive: true } });
  res.json({ message: 'Email verified. You can now sign in.' });
};
