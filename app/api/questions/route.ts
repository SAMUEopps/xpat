// import { NextRequest, NextResponse } from 'next/server';
// import { Question } from '@/models/Question';
// import { MatchingEngine } from '@/lib/matching-engine';
// import { connectDB } from '@/lib/db';
// import { auth } from '@/lib/auth';

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();
//     const user = await auth(req);
//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { title, description, category, tags, urgency } = body;

//     const question = await Question.create({
//       userId: user.id,
//       title,
//       description,
//       category,
//       tags,
//       urgency,
//       status: 'open',
//     });

//     // Find matching experts
//     const matches = await MatchingEngine.findMatches(question._id);

//     // Here you would trigger notifications to experts
//     // via WebSocket or push notifications

//     return NextResponse.json({ 
//       question,
//       matches,
//       message: 'Question created successfully' 
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Error creating question:', error);
//     return NextResponse.json(
//       { error: 'Failed to create question' },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();
//     const user = await auth(req);
//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const status = searchParams.get('status');
//     const role = searchParams.get('role');

//     let filter: any = {};
    
//     if (role === 'expert') {
//       filter.assignedExpert = user.id;
//     } else {
//       filter.userId = user.id;
//     }

//     if (status) {
//       filter.status = status;
//     }

//     const questions = await Question.find(filter)
//       .populate('userId', 'name email avatar')
//       .populate('assignedExpert', 'name email avatar')
//       .sort({ createdAt: -1 })
//       .limit(50);

//     return NextResponse.json({ questions });

//   } catch (error) {
//     console.error('Error fetching questions:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch questions' },
//       { status: 500 }
//     );
//   }
// }

// app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Question } from '@/models/Question';
import { MatchingEngine } from '@/lib/matching-engine';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSocketInstance } from '@/lib/socket-instance';


export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, tags, urgency } = body;

    // Create question
    const question = await Question.create({
      userId: user.id,
      title,
      description,
      category,
      tags,
      urgency: urgency || 'medium',
      status: 'open',
      expertNotifications: [],
      messages: [],
    });

    // Find matching experts
    const matches = await MatchingEngine.findMatches(question._id.toString());

    // Get socket instance and notify experts
    const io = getSocketInstance();
    if (io) {
      // Notify matched experts in real-time
      for (const match of matches.matches) {
        io.notifyExperts(question._id.toString(), [match.expertId]);
      }

      // Broadcast new question to all available experts
      io.getIO().emit('new_question_available', {
        questionId: question._id,
        title: question.title,
        category: question.category,
        tags: question.tags,
        urgency: question.urgency,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ 
      question,
      matches: matches.matches,
      message: 'Question created and experts notified' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    let filter: any = {};
    
    if (role === 'expert') {
      // Expert sees questions assigned to them or open questions they're matched with
      filter.$or = [
        { assignedExpert: user.id },
        { matchedExperts: user.id, status: 'open' }
      ];
    } else {
      filter.userId = user.id;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const questions = await Question.find(filter)
      .populate('userId', 'name email avatar')
      .populate('assignedExpert', 'name email avatar')
      .populate('matchedExperts', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}