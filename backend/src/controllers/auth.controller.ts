import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import ActivityLog from '../models/ActivityLog';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email }).populate('companyId', 'id name');

    if (!user || !user.get('isActive')) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.get('password'));
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const userId = user._id.toString();
    const companyId = user.get('companyId')?.toString();

    const payload = { userId, email: user.get('email'), role: user.get('role'), companyId };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt });

    await ActivityLog.create({
      userId: user._id,
      companyId: user.get('companyId'),
      action: 'Logged In',
      module: 'Auth',
      status: 'Success',
      ipAddress: req.ip,
    });

    const company = user.get('companyId');
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: userId,
        name: user.get('name'),
        email: user.get('email'),
        role: user.get('role'),
        avatar: user.get('avatar'),
        company: company ? { id: company._id.toString(), name: company.name } : null,
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

    const payload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
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

export const changePassword = async (req: Request & { user?: { userId: string } }, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new password are required' });
      return;
    }
    const user = await User.findById(req.user!.userId);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    const valid = await bcrypt.compare(currentPassword, user.get('password'));
    if (!valid) { res.status(401).json({ message: 'Current password is incorrect' }); return; }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, { password: hashed });
    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request & { user?: { userId: string } }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId)
      .select('name email role avatar')
      .populate('companyId', 'name');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const company = user.get('companyId') as { _id: { toString(): string }; name: string } | null;
    res.json({
      id: user._id.toString(),
      name: user.get('name'),
      email: user.get('email'),
      role: user.get('role'),
      avatar: user.get('avatar'),
      company: company ? { id: company._id.toString(), name: company.name } : null,
    });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
