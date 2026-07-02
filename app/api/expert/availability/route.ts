// app/api/expert/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ExpertProfile } from '@/models/ExpertProfile';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSocketInstance } from '@/lib/socket-instance';


export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, maxQuestionsPerDay } = body;

    const update: any = {};
    if (status) {
      update['availability.status'] = status;
      if (status === 'available') {
        update['availability.lastActiveAt'] = new Date();
      }
    }
    if (maxQuestionsPerDay !== undefined) {
      update['availability.maxQuestionsPerDay'] = maxQuestionsPerDay;
    }

    const profile = await ExpertProfile.findOneAndUpdate(
      { userId: user.id },
      update,
      { new: true }
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Expert profile not found' },
        { status: 404 }
      );
    }

    // Broadcast availability change
    const io = getSocketInstance();
    if (io) {
      io.getIO().emit('expert_status_change', {
        expertId: user.id,
        status: profile.availability.status,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ 
      availability: profile.availability,
      message: 'Availability updated successfully' 
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await ExpertProfile.findOne({ userId: user.id });
    if (!profile) {
      return NextResponse.json(
        { error: 'Expert profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      availability: profile.availability,
      currentSessions: profile.totalSessions,
      rating: profile.rating,
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}