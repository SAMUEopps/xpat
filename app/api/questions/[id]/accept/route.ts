// // app/api/questions/[id]/accept/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { Question } from '@/models/Question';
// import { ExpertProfile } from '@/models/ExpertProfile';
// import { connectDB } from '@/lib/db';
// import { auth } from '@/lib/auth';
// import { getSocketInstance } from '@/lib/socket-instance'; // ✅ Use getSocketInstance instead
// import mongoose from 'mongoose';

// export async function POST(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     await connectDB();
//     const { id } = await params;
//     const user = await auth(req);
    
//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Check if user is an expert
//     if (user.role !== 'expert' && user.role !== 'both') {
//       return NextResponse.json(
//         { error: 'Only experts can accept questions' },
//         { status: 403 }
//       );
//     }

//     // Find the question
//     const question = await Question.findById(id)
//       .populate('userId', 'name email avatar');
    
//     if (!question) {
//       return NextResponse.json({ error: 'Question not found' }, { status: 404 });
//     }

//     // Check if question is still open
//     if (question.status !== 'open') {
//       return NextResponse.json(
//         { error: 'Question is no longer available' },
//         { status: 400 }
//       );
//     }

//     // Check if expert is matched with this question
//     const isMatched = question.matchedExperts.some(
//       (expertId: mongoose.Types.ObjectId) => expertId.toString() === user.id
//     );

//     if (!isMatched) {
//       return NextResponse.json(
//         { error: 'You are not matched with this question' },
//         { status: 403 }
//       );
//     }

//     // Assign expert to question
//     question.assignedExpert = new mongoose.Types.ObjectId(user.id);
//     question.status = 'assigned';
    
//     // Update notification status
//     const notification = question.expertNotifications.find(
//       (n: any) => n.expertId.toString() === user.id
//     );
//     if (notification) {
//       notification.respondedAt = new Date();
//       notification.response = 'accepted';
//     }

//     await question.save();

//     // Update expert's profile
//     await ExpertProfile.findOneAndUpdate(
//       { userId: user.id },
//       { 
//         $inc: { 'availability.currentQuestionsToday': 1 },
//         $set: { 'availability.status': 'busy' }
//       }
//     );

//     // Get the populated question with expert info
//     const updatedQuestion = await Question.findById(id)
//       .populate('userId', 'name email avatar')
//       .populate('assignedExpert', 'name email avatar');

//     // ✅ Use getSocketInstance instead of getIO
//     const socketManager = getSocketInstance();
//     if (socketManager) {
//       const io = socketManager.getIO();
      
//       // Notify the user who asked the question
//       io.to(`user_${question.userId.toString()}`).emit('question_accepted', {
//         questionId: id,
//         expertId: user.id,
//         expertName: user.name,
//         message: `An expert has accepted your question!`,
//       });

//       // Notify everyone in the question room
//       io.to(`question_${id}`).emit('expert_assigned', {
//         questionId: id,
//         expertId: user.id,
//         expertName: user.name,
//       });

//       // Notify all experts that this question is taken
//       io.to('expert_room').emit('question_closed', {
//         questionId: id,
//         acceptedBy: user.id,
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       question: updatedQuestion,
//       message: 'Question accepted successfully'
//     });

//   } catch (error) {
//     console.error('Error accepting question:', error);
//     return NextResponse.json(
//       { error: 'Failed to accept question' },
//       { status: 500 }
//     );
//   }
// }

// app/api/questions/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Question } from '@/models/Question';
import { ExpertProfile } from '@/models/ExpertProfile';
import { Conversation } from '@/models/Conversation';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSocketInstance } from '@/lib/socket-instance';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await auth(req);
    
    console.log('📨 Accept question request:', {
      questionId: id,
      userId: user?.id,
      userRole: user?.role,
    });
    
    if (!user) {
      console.log('❌ Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an expert
    if (user.role !== 'expert' && user.role !== 'both') {
      console.log('❌ User is not an expert:', user.role);
      return NextResponse.json(
        { error: 'Only experts can accept questions' },
        { status: 403 }
      );
    }

    // Find the question
    const question = await Question.findById(id)
      .populate('userId', 'name email avatar');
    
    if (!question) {
      console.log('❌ Question not found:', id);
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    console.log('📄 Question found:', {
      id: question._id,
      status: question.status,
      assignedExpert: question.assignedExpert,
      matchedExperts: question.matchedExperts,
    });

    // Check if question is still open
    if (question.status !== 'open') {
      console.log('❌ Question is not open:', question.status);
      return NextResponse.json(
        { error: `Question is no longer available (status: ${question.status})` },
        { status: 400 }
      );
    }

    // ✅ Check if expert is matched with this question OR allow any expert to accept
    const isMatched = question.matchedExperts.some(
      (expertId: mongoose.Types.ObjectId) => expertId.toString() === user.id
    );

    // ✅ Allow any expert to accept, but give priority to matched ones
    console.log('🔍 Match check:', {
      isMatched,
      expertId: user.id,
      matchedExperts: question.matchedExperts.map((e: any) => e.toString()),
    });

    // Assign expert to question
    question.assignedExpert = new mongoose.Types.ObjectId(user.id);
    question.status = 'assigned';
    
    // Update notification status if exists
    const notification = question.expertNotifications.find(
      (n: any) => n.expertId.toString() === user.id
    );
    if (notification) {
      notification.respondedAt = new Date();
      notification.response = 'accepted';
    } else {
      // Add notification if it doesn't exist
      question.expertNotifications.push({
        expertId: new mongoose.Types.ObjectId(user.id),
        sentAt: new Date(),
        respondedAt: new Date(),
        response: 'accepted',
      });
    }

    await question.save();
    console.log('✅ Question assigned to expert:', user.id);

    // Update expert's profile
    await ExpertProfile.findOneAndUpdate(
      { userId: user.id },
      { 
        $inc: { 'availability.currentQuestionsToday': 1 },
        $set: { 'availability.status': 'busy' }
      }
    );
    console.log('✅ Expert profile updated');

    // ✅ Create or update conversation
    let conversation = await Conversation.findOne({ questionId: id });
    if (!conversation) {
      conversation = await Conversation.create({
        questionId: id,
        participants: [
          question.userId._id,
          user.id,
        ],
        status: 'active',
        unreadCount: new Map([
          [question.userId._id.toString(), 0],
          [user.id, 0],
        ]),
      });
      console.log('✅ New conversation created:', conversation._id);
    }

    // Get the populated question with expert info
    const updatedQuestion = await Question.findById(id)
      .populate('userId', 'name email avatar')
      .populate('assignedExpert', 'name email avatar');

    // Notify via Socket.IO
    const socketManager = getSocketInstance();
    if (socketManager) {
      const io = socketManager.getIO();
      
      console.log('📡 Notifying via socket...');
      
      // Notify the user who asked the question
      const userSocketId = `user_${question.userId._id.toString()}`;
      io.to(userSocketId).emit('question_accepted', {
        questionId: id,
        expertId: user.id,
        expertName: user.name,
        message: `An expert has accepted your question!`,
      });
      console.log(`📡 Notified user: ${userSocketId}`);

      // Notify everyone in the question room
      io.to(`question_${id}`).emit('expert_assigned', {
        questionId: id,
        expertId: user.id,
        expertName: user.name,
      });
      console.log(`📡 Notified question room: question_${id}`);

      // Notify all experts that this question is taken
      io.to('expert_room').emit('question_closed', {
        questionId: id,
        acceptedBy: user.id,
        expertName: user.name,
      });
      console.log('📡 Notified expert_room');
    }

    console.log('✅ Question acceptance complete');

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
      conversation: conversation,
      message: 'Question accepted successfully'
    });

  } catch (error) {
    console.error('❌ Error accepting question:', error);
    return NextResponse.json(
      { error: 'Failed to accept question' },
      { status: 500 }
    );
  }
}