
// app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Question } from '@/models/Question';
import { MatchingEngine } from '@/lib/matching-engine';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSocketInstance, checkSocketInstance } from '@/lib/socket-instance';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, tags, urgency } = body;

    console.log('📝 Creating new question:', { title, category, tags, urgency });

    // Create question
    const question = await Question.create({
      userId: user.id,
      title,
      description,
      category,
      tags: tags || [],
      urgency: urgency || 'medium',
      status: 'open',
      expertNotifications: [],
      messages: [],
    });

    // Populate user info
    const populatedQuestion = await Question.findById(question._id)
      .populate('userId', 'name email avatar');

    console.log('✅ Question created:', question._id);

    // Find matching experts
    const matches = await MatchingEngine.findMatches(question._id.toString(), 5);

    console.log(`🎯 Found ${matches.matches.length} matching experts`);

    // ✅ FIX: Check if socket instance exists before using
    const socketManager = getSocketInstance();
    
    if (socketManager) {
      console.log('📡 Socket instance found, notifying experts...');
      const io = socketManager.getIO();
      
      // 1. Broadcast to all experts in expert_room
      io.to('expert_room').emit('new_question_available', {
        questionId: question._id,
        question: {
          _id: question._id,
          title: question.title,
          description: question.description,
          category: question.category,
          tags: question.tags,
          urgency: question.urgency,
          userId: populatedQuestion.userId,
          createdAt: question.createdAt,
        },
        matches: matches.matches,
        timestamp: new Date(),
      });

      console.log('📢 Broadcasted to expert_room');

      // 2. Send individual notifications to matched experts
      for (const match of matches.matches) {
        const expertId = match.expertId;
        console.log(`📨 Notifying expert ${expertId} with score ${match.score}`);
        
        // Send to individual expert room
        io.to(`expert_${expertId}`).emit('new_question_notification', {
          questionId: question._id,
          question: {
            _id: question._id,
            title: question.title,
            description: question.description,
            category: question.category,
            tags: question.tags,
            urgency: question.urgency,
            userId: populatedQuestion.userId,
            createdAt: question.createdAt,
          },
          matchScore: match.score,
          matchDetails: match.matchDetails,
          matchedSkills: match.matchedSkills,
          timestamp: new Date(),
        });

        console.log(`✅ Notification sent to expert ${expertId}`);
      }

      // 3. Also check if expert is online via socket connections
      const sockets = await io.fetchSockets();
      console.log(`📱 Total connected sockets: ${sockets.length}`);
      
      // Log which experts are online
      const expertRooms = new Set();
      for (const socket of sockets) {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room.startsWith('expert_')) {
            expertRooms.add(room);
          }
        });
      }
      console.log(`👥 Experts online: ${Array.from(expertRooms).join(', ')}`);
      
    } else {
      console.error('❌ Socket instance not available!');
      console.log('💡 Make sure server.ts is properly setting the socket instance');
    }

    return NextResponse.json({ 
      question: populatedQuestion,
      matches: matches.matches,
      message: 'Question created and experts notified' 
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating question:', error);
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

