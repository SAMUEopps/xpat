// // app/api/questions/[id]/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { Question } from '@/models/Question';
// import { connectDB } from '@/lib/db';
// import { auth } from '@/lib/auth';
// import { getSocketInstance } from '@/lib/socket-instance';


// export async function GET(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectDB();
//     const user = await auth(req);
//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const question = await Question.findById(params.id)
//       .populate('userId', 'name email avatar')
//       .populate('assignedExpert', 'name email avatar')
//       .populate('matchedExperts', 'name email avatar');

//     if (!question) {
//       return NextResponse.json({ error: 'Question not found' }, { status: 404 });
//     }

//     // Check if user has access
//     const isOwner = question.userId._id.toString() === user.id;
//     const isExpert = question.assignedExpert?._id.toString() === user.id;
//     const isMatched = question.matchedExperts.some(
//       (e: any) => e._id.toString() === user.id
//     );

//     if (!isOwner && !isExpert && !isMatched) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     return NextResponse.json({ question });

//   } catch (error) {
//     console.error('Error fetching question:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch question' },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectDB();
//     const user = await auth(req);
//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { status, userRating, expertRating } = body;

//     const question = await Question.findById(params.id);
//     if (!question) {
//       return NextResponse.json({ error: 'Question not found' }, { status: 404 });
//     }

//     // Check permissions based on what's being updated
//     if (status && question.status !== status) {
//       const isOwner = question.userId.toString() === user.id;
//       const isExpert = question.assignedExpert?.toString() === user.id;

//       if (status === 'resolved' && !isOwner) {
//         return NextResponse.json(
//           { error: 'Only the question owner can mark as resolved' },
//           { status: 403 }
//         );
//       }

//       if (status === 'cancelled' && !isOwner) {
//         return NextResponse.json(
//           { error: 'Only the question owner can cancel' },
//           { status: 403 }
//         );
//       }

//       question.status = status;

//       if (status === 'resolved') {
//         question.resolvedAt = new Date();
//         // Calculate time to resolution
//         question.timeToResolution = Math.floor(
//           (new Date().getTime() - question.createdAt.getTime()) / 1000
//         );
//       }
//     }

//     // Handle ratings
//     if (userRating !== undefined) {
//       const isOwner = question.userId.toString() === user.id;
//       if (!isOwner) {
//         return NextResponse.json(
//           { error: 'Only the question owner can rate' },
//           { status: 403 }
//         );
//       }
//       question.userRating = userRating;
//     }

//     if (expertRating !== undefined) {
//       const isExpert = question.assignedExpert?.toString() === user.id;
//       if (!isExpert) {
//         return NextResponse.json(
//           { error: 'Only the assigned expert can rate' },
//           { status: 403 }
//         );
//       }
//       question.expertRating = expertRating;
//     }

//     await question.save();

//     // Notify about status change via socket
//     const io = getSocketInstance();
//     if (io) {
//       io.getIO().to(`question_${params.id}`).emit('status_update', {
//         questionId: params.id,
//         status: question.status,
//         updatedBy: user.id,
//         timestamp: new Date(),
//       });
//     }

//     return NextResponse.json({ question });

//   } catch (error) {
//     console.error('Error updating question:', error);
//     return NextResponse.json(
//       { error: 'Failed to update question' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { Question } from '@/models/Question';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSocketInstance } from '@/lib/socket-instance';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const user = await auth(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const question = await Question.findById(id)
      .populate('userId', 'name email avatar')
      .populate('assignedExpert', 'name email avatar')
      .populate('matchedExperts', 'name email avatar');

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const isOwner = question.userId?._id?.toString() === user.id;
    const isExpert = question.assignedExpert?._id?.toString() === user.id;
    const isMatched = question.matchedExperts?.some(
      (expert: any) => expert._id?.toString() === user.id
    );

    if (!isOwner && !isExpert && !isMatched) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error fetching question:', error);

    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const user = await auth(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { status, userRating, expertRating } = body;

    const question = await Question.findById(id);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update status
    if (status && question.status !== status) {
      const isOwner = question.userId.toString() === user.id;
      const isExpert =
        question.assignedExpert?.toString() === user.id;

      if (status === 'resolved' && !isOwner) {
        return NextResponse.json(
          { error: 'Only the question owner can mark as resolved' },
          { status: 403 }
        );
      }

      if (status === 'cancelled' && !isOwner) {
        return NextResponse.json(
          { error: 'Only the question owner can cancel' },
          { status: 403 }
        );
      }

      question.status = status;

      if (status === 'resolved') {
        question.resolvedAt = new Date();
        question.timeToResolution = Math.floor(
          (Date.now() - question.createdAt.getTime()) / 1000
        );
      }
    }

    // User rating
    if (userRating !== undefined) {
      const isOwner = question.userId.toString() === user.id;

      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only the question owner can rate' },
          { status: 403 }
        );
      }

      question.userRating = userRating;
    }

    // Expert rating
    if (expertRating !== undefined) {
      const isExpert =
        question.assignedExpert?.toString() === user.id;

      if (!isExpert) {
        return NextResponse.json(
          { error: 'Only the assigned expert can rate' },
          { status: 403 }
        );
      }

      question.expertRating = expertRating;
    }

    await question.save();

    // Notify clients via Socket.IO
    const socket = getSocketInstance();

    if (socket) {
      socket.getIO().to(`question_${id}`).emit('status_update', {
        questionId: id,
        status: question.status,
        updatedBy: user.id,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error updating question:', error);

    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}