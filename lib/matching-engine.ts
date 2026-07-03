// lib/matching-engine.ts
import { ExpertProfile } from '@/models/ExpertProfile';
import { Question } from '@/models/Question';
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
    console.log('🔍 Finding matches for question:', questionId);
    
    const question = await Question.findById(questionId);
    if (!question) {
      console.error('❌ Question not found');
      throw new Error('Question not found');
    }

    console.log('📝 Question tags:', question.tags);

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

    console.log(`👥 Found ${experts.length} available experts`);

    const scores: MatchScore[] = [];

    for (const expert of experts) {
      const score = this.calculateMatchScore(expert, question);
      if (score.score > 0) {
        scores.push(score);
        console.log(`📊 Expert ${expert.userId.name} score: ${score.score}, matched skills: ${score.matchedSkills}`);
      }
    }

    // Sort by score and take top matches
    const topMatches = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`🎯 Top ${topMatches.length} matches found`);

    if (topMatches.length === 0) {
      console.log('⚠️ No matches found for this question');
      return {
        matches: [],
        expertIds: [],
      };
    }

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

    console.log(`✅ Updated question with ${matchedExpertIds.length} matched experts`);

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

    // Check primary expertise match (50% weight)
    const primaryWeight = 0.5;
    let primaryMatches = 0;
    const primaryTotal = Math.min(expert.primaryExpertise.length, 3);
    
    for (const skill of expert.primaryExpertise) {
      const matches = question.tags.some((tag: string) => 
        tag.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(tag.toLowerCase()) ||
        question.category.toLowerCase().includes(skill.toLowerCase())
      );
      if (matches) {
        primaryMatches++;
        matchedSkills.push(skill);
      }
    }
    
    const primaryScore = primaryTotal > 0 ? (primaryMatches / primaryTotal) * primaryWeight * 100 : 0;
    skillMatch += primaryScore;

    // Check secondary skills match (30% weight)
    const secondaryWeight = 0.3;
    let secondaryMatches = 0;
    const secondaryTotal = Math.min(expert.secondarySkills.length, 10);
    
    for (const skill of expert.secondarySkills) {
      const matches = question.tags.some((tag: string) => 
        tag.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(tag.toLowerCase())
      );
      if (matches) {
        secondaryMatches++;
        matchedSkills.push(skill);
      }
    }
    
    const secondaryScore = secondaryTotal > 0 ? (secondaryMatches / secondaryTotal) * secondaryWeight * 100 : 0;
    skillMatch += secondaryScore;

    // Expertise stats match (20% weight)
    const statsWeight = 0.2;
    let statsMatch = 0;
    let totalStats = 0;
    
    for (const stat of expert.expertiseStats || []) {
      if (question.tags.some((tag: string) => tag.includes(stat.tag) || stat.tag.includes(tag))) {
        statsMatch += (stat.questionsSolved / (stat.questionsSolved + 10)) * statsWeight * 100;
        totalStats++;
      }
    }
    skillMatch += statsMatch;

    // Normalize skillMatch to 0-100
    skillMatch = Math.min(skillMatch, 100);

    console.log(`📊 Skill match for ${expert.userId.name}: ${skillMatch}%`);

    // Availability score (25% of total)
    let availabilityScore = 0;
    if (expert.availability.status === 'available') {
      availabilityScore = 100;
      const remaining = expert.availability.maxQuestionsPerDay - expert.availability.currentQuestionsToday;
      if (remaining < 2) {
        availabilityScore = 50;
      }
    } else if (expert.availability.status === 'busy') {
      availabilityScore = 50;
    }

    // Rating score (20% of total)
    const ratingScore = (expert.rating / 5) * 100;

    // Response speed score (20% of total)
    const avgResponseTime = expert.responseTime || 60;
    const speedScore = Math.max(0, Math.min(100, (300 - avgResponseTime) / 300 * 100));

    // Experience score (10% of total)
    const experienceScore = Math.min(expert.yearsOfExperience / 10, 1) * 100;

    // Urgency modifier
    let urgencyModifier = 1;
    if (question.urgency === 'high') {
      urgencyModifier = 1.2;
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

    totalScore = Math.round(Math.min(totalScore, 100));

    // Only return if score is above threshold
    if (totalScore < 20) {
      return {
        expertId: expert.userId._id.toString(),
        score: 0,
        matchedSkills: [],
        matchDetails: {
          skillMatch: 0,
          availabilityScore: 0,
          ratingScore: 0,
          responseSpeedScore: 0,
          experienceScore: 0,
        }
      };
    }

    return {
      expertId: expert.userId._id.toString(),
      score: totalScore,
      matchedSkills: [...new Set(matchedSkills)],
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

    expertProfile.totalSessions += 1;

    for (const tag of question.tags) {
      const statIndex = expertProfile.expertiseStats.findIndex((s: { tag: any; }) => s.tag === tag);
      if (statIndex >= 0) {
        expertProfile.expertiseStats[statIndex].questionsSolved += 1;
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