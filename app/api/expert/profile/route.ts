import { NextRequest, NextResponse } from 'next/server';
import { ExpertProfile } from '@/models/ExpertProfile';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, bio, primaryExpertise, secondarySkills, 
      yearsOfExperience, hourlyRate, availability 
    } = body;

    // Check if expert profile exists
    let profile = await ExpertProfile.findOne({ userId: user.id });

    if (profile) {
      // Update existing profile
      profile.title = title || profile.title;
      profile.bio = bio || profile.bio;
      profile.primaryExpertise = primaryExpertise || profile.primaryExpertise;
      profile.secondarySkills = secondarySkills || profile.secondarySkills;
      profile.yearsOfExperience = yearsOfExperience || profile.yearsOfExperience;
      profile.hourlyRate = hourlyRate || profile.hourlyRate;
      if (availability) {
        profile.availability = { ...profile.availability, ...availability };
      }
      await profile.save();
    } else {
      // Create new profile
      profile = await ExpertProfile.create({
        userId: user.id,
        title,
        bio,
        primaryExpertise,
        secondarySkills: secondarySkills || [],
        yearsOfExperience: yearsOfExperience || 0,
        hourlyRate,
        availability: availability || { status: 'offline', maxQuestionsPerDay: 5 },
      });
    }

    // Update user role if needed
    if (user.role === 'user') {
      await User.findByIdAndUpdate(user.id, { role: 'expert' });
    }

    return NextResponse.json({ 
      profile,
      message: 'Expert profile saved successfully' 
    });

  } catch (error) {
    console.error('Error saving expert profile:', error);
    return NextResponse.json(
      { error: 'Failed to save expert profile' },
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

    const profile = await ExpertProfile.findOne({ userId: user.id })
      .populate('userId', 'name email avatar');

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Error fetching expert profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expert profile' },
      { status: 500 }
    );
  }
}