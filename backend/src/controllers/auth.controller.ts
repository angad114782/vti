import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import ActivityLog from '../models/ActivityLog';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logActivity } from '../utils/activity';
import { getUserId } from '../utils/authContext';
import { getCompanyReference } from '../utils/companyReference';

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, password } = req.body as { email: string; password: string };
    const email = normalizeEmail(rawEmail ?? '');

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email }).populate('companyId', 'id name companyCode status isDeleted');

    if (!user || !user.get('isActive')) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const lockedUntil = user.get('loginLockedUntil') as Date | undefined;
    if (lockedUntil && lockedUntil > new Date()) {
      res.status(429).json({ message: 'Too many failed attempts. Try again later.', code: 'LOGIN_LOCKED', retryAt: lockedUntil.toISOString() });
      return;
    }
    const company = user.get('companyId') as { status?: string; isDeleted?: boolean } | null;
    if (company && (company.isDeleted || ['SUSPENDED', 'EXPIRED'].includes(company.status ?? ''))) {
      res.status(403).json({ message: 'Company account is not active', code: 'COMPANY_INACTIVE' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.get('password'));
    if (!isPasswordValid) {
      const attempts = Number(user.get('failedLoginAttempts') ?? 0) + 1;
      await User.updateOne({ _id: user._id }, attempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? { $set: { failedLoginAttempts: 0, loginLockedUntil: new Date(Date.now() + LOGIN_LOCK_MINUTES * 60_000) } }
        : { $set: { failedLoginAttempts: attempts } });
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lastLoginAt: new Date(), accountStatus: 'ACTIVE' }, $unset: { loginLockedUntil: 1 } });

    const userId = user._id.toString();
    const populatedCompany = user.get('companyId') as { _id: { toString(): string }; name: string; companyCode?: string } | null;
    const companyId = populatedCompany?._id?.toString();

    const sessionVersion = Number(user.get('sessionVersion') ?? 0);
    const payload = { userId, email: user.get('email'), role: user.get('role'), companyId, sessionVersion };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt });

    await ActivityLog.create({
      userId: user._id,
      companyId: companyId ?? undefined,
      action: 'Logged In',
      module: 'Auth',
      status: 'Success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: userId,
        name: user.get('name'),
        email: user.get('email'),
        role: user.get('role'),
        avatar: user.get('avatar'),
        company: populatedCompany ? { id: populatedCompany._id.toString(), name: populatedCompany.name, companyCode: getCompanyReference(populatedCompany._id, populatedCompany.companyCode) } : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };
    if (!token) {
      res.status(400).json({ message: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(token);

    const stored = await RefreshToken.findOne({ token });
    if (!stored || stored.get('expiresAt') < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    await RefreshToken.deleteOne({ token });

    const user = await User.findById(decoded.userId).select('email role companyId isActive sessionVersion').lean();
    if (!user || !user.isActive || user.companyId?.toString() !== decoded.companyId || Number(user.sessionVersion ?? 0) !== Number(decoded.sessionVersion ?? 0)) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }
    const payload = { userId: user._id.toString(), email: user.email, role: user.role, companyId: user.companyId?.toString(), sessionVersion: Number(user.sessionVersion ?? 0) };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({ token: newRefreshToken, userId: decoded.userId, expiresAt });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };
    if (token) {
      await RefreshToken.deleteMany({ token });
    }
    res.json({ message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new password are required' });
      return;
    }
    const user = await User.findById(getUserId(req));
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    const valid = await bcrypt.compare(currentPassword, user.get('password'));
    if (!valid) { res.status(401).json({ message: 'Current password is incorrect' }); return; }
    const history = (user.get('passwordHistory') as string[] | undefined) ?? [];
    for (const previous of [user.get('password'), ...history].slice(0, 5)) {
      if (await bcrypt.compare(newPassword, previous)) {
        res.status(400).json({ message: 'You cannot reuse a recent password' });
        return;
      }
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, { $set: { password: hashed, passwordChangedAt: new Date(), passwordHistory: [user.get('password'), ...history].slice(0, 5) }, $inc: { sessionVersion: 1 } });
    await RefreshToken.deleteMany({ userId: user._id });
    logActivity(req, 'Changed password', 'Auth');
    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { name, email } = req.body as { name?: string; email?: string };
    if (email) {
      const normalizedEmail = normalizeEmail(email);
      const conflict = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } }).lean();
      if (conflict) { res.status(409).json({ message: 'Email already in use' }); return; }
    }
    const updated = await User.findByIdAndUpdate(
      userId,
      { ...(name ? { name: name.trim() } : {}), ...(email ? { email: normalizeEmail(email) } : {}) },
      { returnDocument: 'after' }
    ).select('name email').lean();
    if (!updated) { res.status(404).json({ message: 'User not found' }); return; }
    logActivity(req, `Updated profile — ${updated.name}`, 'Auth');
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(getUserId(req))
      .select('name email role avatar')
      .populate('companyId', 'name companyCode');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const company = user.get('companyId') as { _id: { toString(): string }; name: string; companyCode?: string } | null;
    res.json({
      id: user._id.toString(),
      name: user.get('name'),
      email: user.get('email'),
      role: user.get('role'),
      avatar: user.get('avatar'),
      company: company ? { id: company._id.toString(), name: company.name, companyCode: getCompanyReference(company._id, company.companyCode) } : null,
    });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
