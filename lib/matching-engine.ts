// import { ExpertProfile } from '@/models/ExpertProfile';
// import { Question } from '@/models/Question';

// interface MatchScore {
//   expertId: string;
//   score: number;
//   matchedSkills: string[];
// }

// export class MatchingEngine {
//   static async findMatches(questionId: string, limit: number = 5) {
//     const question = await Question.findById(questionId);
//     if (!question) throw new Error('Question not found');

//     const experts = await ExpertProfile.find({
//     isActive: true,
//     'availability.status': 'available',
//     $expr: {
//         $lt: [
//         '$availability.currentQuestionsToday',
//         '$availability.maxQuestionsPerDay',
//         ],
//     },
//     }).populate('userId');

//     const scores: MatchScore[] = [];

//     for (const expert of experts) {
//       const score = this.calculateMatchScore(expert, question);
//       if (score.score > 0) {
//         scores.push(score);
//       }
//     }

//     // Sort by score and take top matches
//     const matches = scores
//       .sort((a, b) => b.score - a.score)
//       .slice(0, limit);

//     // Update question with matched experts
//     await Question.findByIdAndUpdate(questionId, {
//       matchedExperts: matches.map(m => m.expertId)
//     });

//     return matches;
//   }

//   private static calculateMatchScore(expert: any, question: any): MatchScore {
//     let score = 0;
//     const matchedSkills: string[] = [];

//     // Primary expertise match (40% weight)
//     const primaryMatch = expert.primaryExpertise.filter((skill: string) =>
//       question.tags.includes(skill) || 
//       question.category.toLowerCase().includes(skill.toLowerCase())
//     );
//     score += (primaryMatch.length / Math.min(expert.primaryExpertise.length, 3)) * 40;
//     matchedSkills.push(...primaryMatch);

//     // Secondary skills match (20% weight)
//     const secondaryMatch = expert.secondarySkills.filter((skill: string) =>
//       question.tags.includes(skill) ||
//       question.category.toLowerCase().includes(skill.toLowerCase())
//     );
//     score += (secondaryMatch.length / Math.min(expert.secondarySkills.length, 10)) * 20;
//     matchedSkills.push(...secondaryMatch);

//     // Rating (15% weight)
//     score += (expert.rating / 5) * 15;

//     // Response speed (15% weight)
//     const avgResponseTime = expert.responseTime || 60; // seconds
//     const speedScore = Math.max(0, 100 - avgResponseTime) / 100;
//     score += speedScore * 15;

//     // Experience (10% weight)
//     const experienceScore = Math.min(expert.yearsOfExperience / 10, 1);
//     score += experienceScore * 10;

//     return {
//       expertId: expert.userId._id,
//       score: Math.round(score),
//       matchedSkills
//     };
//   }
// }

// lib/matching-engine.ts
import { ExpertProfile } from '@/models/ExpertProfile';
import { Question } from '@/models/Question';
import { User } from '@/models/User';
import mongoose from 'mongoose';

interface MatchScore {
  expertId: string;
  score: number;
  matchedSkills: string[];
  matchDetails: {
    skillMatch: number;
    availabilityScore: number;
    ratingScore: number;
    responseSpeedScore: number;
    experienceScore: number;
  };
}

export class MatchingEngine {
  static async findMatches(questionId: string, limit: number = 5) {
    const question = await Question.findById(questionId);
    if (!question) throw new Error('Question not found');

    // Find available experts
    const experts = await ExpertProfile.find({
      isActive: true,
      'availability.status': 'available',
      $expr: {
        $lt: [
          '$availability.currentQuestionsToday',
          '$availability.maxQuestionsPerDay',
        ],
      },
    }).populate('userId', 'name email avatar');

    const scores: MatchScore[] = [];

    for (const expert of experts) {
      const score = this.calculateMatchScore(expert, question);
      if (score.score > 0) {
        scores.push(score);
      }
    }

    // Sort by score and take top matches
    const topMatches = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Update question with matched experts
    const matchedExpertIds = topMatches.map(m => new mongoose.Types.ObjectId(m.expertId));
    
    // Add notifications for each matched expert
    const expertNotifications = topMatches.map(m => ({
      expertId: new mongoose.Types.ObjectId(m.expertId),
      sentAt: new Date(),
    }));

    await Question.findByIdAndUpdate(questionId, {
      matchedExperts: matchedExpertIds,
      $push: { expertNotifications: { $each: expertNotifications } }
    });

    return {
      matches: topMatches,
      expertIds: matchedExpertIds,
    };
  }

  static async findMoreMatches(questionId: string, excludeIds: string[], limit: number = 3) {
    const question = await Question.findById(questionId);
    if (!question) throw new Error('Question not found');

    const experts = await ExpertProfile.find({
      isActive: true,
      'availability.status': 'available',
      userId: { $nin: excludeIds },
      $expr: {
        $lt: [
          '$availability.currentQuestionsToday',
          '$availability.maxQuestionsPerDay',
        ],
      },
    }).populate('userId', 'name email avatar');

    const scores: MatchScore[] = [];

    for (const expert of experts) {
      const score = this.calculateMatchScore(expert, question);
      if (score.score > 0) {
        scores.push(score);
      }
    }

    const topMatches = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Add new matches to question
    const matchedExpertIds = topMatches.map(m => new mongoose.Types.ObjectId(m.expertId));
    const expertNotifications = topMatches.map(m => ({
      expertId: new mongoose.Types.ObjectId(m.expertId),
      sentAt: new Date(),
    }));

    await Question.findByIdAndUpdate(questionId, {
      $push: { 
        matchedExperts: { $each: matchedExpertIds },
        expertNotifications: { $each: expertNotifications }
      }
    });

    return {
      matches: topMatches,
      expertIds: matchedExpertIds,
    };
  }

  private static calculateMatchScore(expert: any, question: any): MatchScore {
    let skillMatch = 0;
    let matchedSkills: string[] = [];
    let totalSkillsWeight = 0;

    // Primary expertise match (50% of skill weight)
    const primaryWeight = 0.5;
    const primaryMatch = expert.primaryExpertise.filter((skill: string) => {
      const matches = question.tags.some((tag: string) => 
        tag.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(tag.toLowerCase()) ||
        question.category.toLowerCase().includes(skill.toLowerCase())
      );
      if (matches) totalSkillsWeight += primaryWeight;
      return matches;
    });
    skillMatch += (primaryMatch.length / Math.min(expert.primaryExpertise.length, 3)) * primaryWeight * 100;

    // Secondary skills match (30% of skill weight)
    const secondaryWeight = 0.3;
    const secondaryMatch = expert.secondarySkills.filter((skill: string) => {
      const matches = question.tags.some((tag: string) => 
        tag.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(tag.toLowerCase())
      );
      if (matches) totalSkillsWeight += secondaryWeight;
      return matches;
    });
    skillMatch += (secondaryMatch.length / Math.min(expert.secondarySkills.length, 10)) * secondaryWeight * 100;

    // Expertise stats match (20% of skill weight) - based on historical performance
    const statsWeight = 0.2;
    let statsMatch = 0;
    for (const stat of expert.expertiseStats || []) {
      if (question.tags.includes(stat.tag)) {
        statsMatch += (stat.questionsSolved / (stat.questionsSolved + 10)) * statsWeight * 100;
      }
    }
    skillMatch += statsMatch;

    // Normalize skillMatch to 0-100
    skillMatch = Math.min(skillMatch, 100);

    // Availability score (25% of total)
    let availabilityScore = 0;
    if (expert.availability.status === 'available') {
      availabilityScore = 100;
      // Reduce score if near daily limit
      const remaining = expert.availability.maxQuestionsPerDay - expert.availability.currentQuestionsToday;
      if (remaining < 2) {
        availabilityScore = 50; // Only accept urgent if near capacity
      }
    } else if (expert.availability.status === 'busy') {
      availabilityScore = 50; // Only for urgent questions
    }

    // Rating score (20% of total)
    const ratingScore = (expert.rating / 5) * 100;

    // Response speed score (20% of total)
    const avgResponseTime = expert.responseTime || 60; // seconds
    const speedScore = Math.max(0, Math.min(100, (300 - avgResponseTime) / 300 * 100));

    // Experience score (10% of total)
    const experienceScore = Math.min(expert.yearsOfExperience / 10, 1) * 100;

    // Urgency modifier - high urgency prioritizes speed and availability
    let urgencyModifier = 1;
    if (question.urgency === 'high') {
      urgencyModifier = 1.2; // Boost matching score for urgent questions
    }

    // Calculate total score with weights
    const weights = {
      skillMatch: 0.35,
      availabilityScore: 0.25,
      ratingScore: 0.20,
      speedScore: 0.15,
      experienceScore: 0.05,
    };

    let totalScore = (
      (skillMatch * weights.skillMatch) +
      (availabilityScore * weights.availabilityScore) +
      (ratingScore * weights.ratingScore) +
      (speedScore * weights.speedScore) +
      (experienceScore * weights.experienceScore)
    ) * urgencyModifier;

    return {
      expertId: expert.userId._id.toString(),
      score: Math.round(Math.min(totalScore, 100)),
      matchedSkills: [...primaryMatch, ...secondaryMatch],
      matchDetails: {
        skillMatch: Math.round(skillMatch),
        availabilityScore: Math.round(availabilityScore),
        ratingScore: Math.round(ratingScore),
        responseSpeedScore: Math.round(speedScore),
        experienceScore: Math.round(experienceScore),
      }
    };
  }

  static async updateExpertStats(questionId: string) {
    const question = await Question.findById(questionId);
    if (!question || !question.assignedExpert) return;

    const expertId = question.assignedExpert;
    const expertProfile = await ExpertProfile.findOne({ userId: expertId });
    if (!expertProfile) return;

    // Update total sessions
    expertProfile.totalSessions += 1;

    // Update expertise stats for tags
    for (const tag of question.tags) {
      const statIndex = expertProfile.expertiseStats.findIndex(s => s.tag === tag);
      if (statIndex >= 0) {
        expertProfile.expertiseStats[statIndex].questionsSolved += 1;
        // Update average rating if available
        if (question.expertRating) {
          const current = expertProfile.expertiseStats[statIndex];
          current.averageRating = (current.averageRating * (current.questionsSolved - 1) + question.expertRating) / current.questionsSolved;
        }
      } else {
        expertProfile.expertiseStats.push({
          tag,
          questionsSolved: 1,
          averageRating: question.expertRating || 0,
          averageResponseTime: 0,
        });
      }
    }

    await expertProfile.save();

    // Update expert rating average
    const allQuestions = await Question.find({
      assignedExpert: expertId,
      expertRating: { $exists: true, $ne: null }
    });

    if (allQuestions.length > 0) {
      const avgRating = allQuestions.reduce((sum, q) => sum + (q.expertRating || 0), 0) / allQuestions.length;
      await ExpertProfile.findOneAndUpdate(
        { userId: expertId },
        { rating: avgRating }
      );
    }
  }
}