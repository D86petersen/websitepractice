import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Scoring Service
 * 
 * Handles:
 * 1. Per-question correctness evaluation (single choice, multi-select, short answer)
 * 2. Per-domain aggregation
 * 3. Overall scoring and pass/fail determination
 * 4. Scaled score calculation (300-1000 range)
 */
@Injectable()
export class ScoringService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Score a user's responses for a session
   */
  async scoreSession(sessionId: string): Promise<{
    totalScorePercent: number;
    passFail: 'PASS' | 'FAIL';
    domainScores: Record<string, number>;
    rawCorrectCount: number;
    rawTotalCount: number;
    scaledScore: number;
  }> {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
      include: {
        userResponses: {
          include: { question: { include: { domain: true } } },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Score each response
    const responses = session.userResponses;
    let correctCount = 0;

    for (const response of responses) {
      const isCorrect = await this.evaluateResponse(response);
      await this.prisma.userResponse.update({
        where: { id: response.id },
        data: { isCorrect },
      });

      if (isCorrect) correctCount++;
    }

    const totalCount = responses.length;
    const totalScorePercent = (correctCount / totalCount) * 100;

    // Compute per-domain scores
    const domainScores = await this.computeDomainScores(session.id);

    // Determine pass/fail
    const passThreshold = this.configService.get<number>(
      'PASS_SCORE_PERCENT',
    ) || 70;
    const passFail = totalScorePercent >= passThreshold ? 'PASS' : 'FAIL';

    // Compute scaled score (300-1000)
    const scaledScore = this.computeScaledScore(totalScorePercent);

    // Update session
    await this.prisma.userExamSession.update({
      where: { id: sessionId },
      data: {
        totalScorePercent,
        passFail,
        scoreScale: scaledScore,
        domainScores,
        rawCorrectCount: correctCount,
        rawTotalCount: totalCount,
        completedAt: new Date(),
      },
    });

    return {
      totalScorePercent,
      passFail,
      domainScores,
      rawCorrectCount: correctCount,
      rawTotalCount: totalCount,
      scaledScore,
    };
  }

  /**
   * Evaluate a single response for correctness
   */
  async evaluateResponse(response: any): Promise<boolean> {
    const question = await this.prisma.question.findUnique({
      where: { id: response.questionId },
      include: { answerOptions: true },
    });

    if (!question) return false;

    const selectedIds = response.selectedOptionIds || [];

    switch (question.type) {
      case 'SINGLE_CHOICE':
        return this.evaluateSingleChoice(selectedIds, question.answerOptions);

      case 'MULTI_SELECT':
        return this.evaluateMultiSelect(selectedIds, question.answerOptions);

      case 'SHORT_ANSWER':
        return this.evaluateShortAnswer(
          response.freeTextAnswer,
          question.answerOptions,
        );

      case 'DRAG_DROP_BASIC':
        return this.evaluateDragDrop(selectedIds, question.answerOptions);

      default:
        return false;
    }
  }

  /**
   * Single choice: exactly one option selected, and it's correct
   */
  private evaluateSingleChoice(selectedIds: string[], options: any[]): boolean {
    if (selectedIds.length !== 1) return false;

    const selectedOption = options.find((o) => o.id === selectedIds[0]);
    return selectedOption?.isCorrect || false;
  }

  /**
   * Multi-select: all selected must be correct, all correct must be selected
   */
  private evaluateMultiSelect(selectedIds: string[], options: any[]): boolean {
    const correctIds = options
      .filter((o) => o.isCorrect)
      .map((o) => o.id)
      .sort();
    const selectedIdsSorted = selectedIds.sort();

    return (
      correctIds.length === selectedIdsSorted.length &&
      correctIds.every((id, i) => id === selectedIdsSorted[i])
    );
  }

  /**
   * Short answer: check against known correct answers (regex-based)
   * For now, simple exact match; can be enhanced with fuzzy matching
   */
  private evaluateShortAnswer(
    freeText: string,
    options: any[],
  ): boolean {
    if (!freeText) return false;

    const cleanedFreeText = freeText.toLowerCase().trim();

    for (const option of options) {
      if (!option.isCorrect) continue;

      // Option text could contain regex pattern or exact match
      const pattern = option.text;
      try {
        // Try as regex first
        const regex = new RegExp(`^${pattern}$`, 'i');
        if (regex.test(freeText)) return true;
      } catch {
        // Fall back to case-insensitive exact match
        if (cleanedFreeText === pattern.toLowerCase()) return true;
      }
    }

    return false;
  }

  /**
   * Drag-drop: validate mapped pairs match correct answers
   */
  private evaluateDragDrop(selectedIds: string[], options: any[]): boolean {
    // Simplified: assume selectedIds is JSON encoded mapping
    // Production system would have more sophisticated validation
    try {
      const mapping = JSON.parse(selectedIds[0] || '{}');
      const correctMapping = {};

      for (const opt of options) {
        if (opt.isCorrect) {
          correctMapping[opt.id] = true;
        }
      }

      // Check if selected mapping matches correct one
      return Object.keys(mapping).every((k) => correctMapping[k]);
    } catch {
      return false;
    }
  }

  /**
   * Compute per-domain scores
   */
  private async computeDomainScores(
    sessionId: string,
  ): Promise<Record<string, number>> {
    const responses = await this.prisma.userResponse.findMany({
      where: { sessionId },
      include: { question: { include: { domain: true } } },
    });

    const byDomain: Record<string, { correct: number; total: number }> = {};

    for (const response of responses) {
      const domainKey = response.question.domain.key;
      if (!byDomain[domainKey]) {
        byDomain[domainKey] = { correct: 0, total: 0 };
      }

      byDomain[domainKey].total++;
      if (response.isCorrect) {
        byDomain[domainKey].correct++;
      }
    }

    const scores: Record<string, number> = {};
    for (const [domain, stats] of Object.entries(byDomain)) {
      scores[domain] = (stats.correct / stats.total) * 100;
    }

    return scores;
  }

  /**
   * Compute scaled score (300-1000 range)
   * 
   * This is an estimation only. Real Cisco exams use IRT (Item Response Theory).
   * 300-450 = below passing, 450+ = passing, 1000 = perfect
   */
  private computeScaledScore(percentScore: number): number {
    const minScale = this.configService.get<number>('SCALED_SCORE_MIN') || 300;
    const maxScale = this.configService.get<number>('SCALED_SCORE_MAX') || 1000;

    return Math.round(minScale + (percentScore / 100) * (maxScale - minScale));
  }
}
