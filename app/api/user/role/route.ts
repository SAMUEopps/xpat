import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role } = body;

    if (!['user', 'expert', 'both'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { role },
      { new: true }
    ).select('-password');

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}