import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { connectDB } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function auth(req: NextRequest) {
  try {
    await connectDB();
    
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    if (!decoded.userId) {
      return null;
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  } catch (error) {
    return null;
  }
}

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function hashPassword(password: string) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashedPassword: string) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
}