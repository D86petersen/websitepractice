import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import * as crypto from 'crypto';

/**
 * Core Exam Generation Service
 * 
 * Handles deterministic, reproducible exam generation that:
 * 1. Respects domain weight distribution from blueprint
 * 2. Respects difficulty mix (e.g., 20% easy, 60% medium, 20% hard)
 * 3. Supports deterministic regeneration via seed
 */
@Injectable()
export class ExamGenerationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a question set for an exam
   * 
   * For FIXED forms: simply return questions in order from ExamFormQuestion
   * For DYNAMIC forms: use blueprint rules to sample questions
   */
  async generateExamQuestions(
    examFormId: string,
    seed?: string,
  ): Promise<{ questions: any[]; seed: string }> {
    const examForm = await this.prisma.examForm.findUnique({
      where: { id: examFormId },
      include: { blueprint: true },
    });

    if (!examForm) {
      throw new Error('Exam form not found');
    }

    if (examForm.mode === 'FIXED') {
      const questions = await this.prisma.examFormQuestion.findMany({
        where: { examFormId },
        include: { question: { include: { answerOptions: true, domain: true } } },
        orderBy: { orderIndex: 'asc' },
      });

      return {
        questions: questions.map((q) => q.question),
        seed: 'fixed',
      };
    }

    // DYNAMIC mode
    const actualSeed = seed || crypto.randomBytes(16).toString('hex');
    const rules = examForm.rulesJson || {};

    const questions = await this.sampleQuestionsForDynamicExam(
      examForm,
      rules,
      actualSeed,
    );

    return { questions, seed: actualSeed };
  }

  /**
   * Sample questions for a dynamic exam based on blueprint weights and difficulty distribution
   */
  private async sampleQuestionsForDynamicExam(
    examForm: any,
    rules: any,
    seed: string,
  ): Promise<any[]> {
    const blueprint = await this.prisma.examBlueprint.findUnique({
      where: { id: examForm.blueprintId },
    });

    // Use blueprint domain weights (or override from rules)
    const domainWeights = rules.domainWeights || blueprint.domainWeights;

    // Difficulty mix: default 20% easy, 60% medium, 20% hard
    const difficultyMix = rules.difficultyMix || {
      easy: 0.2,
      medium: 0.6,
      hard: 0.2,
    };

    // Allowed question types
    const allowedTypes = rules.questionTypes || [
      'SINGLE_CHOICE',
      'MULTI_SELECT',
      'DRAG_DROP_BASIC',
      'SHORT_ANSWER',
    ];

    // Create a deterministic RNG from seed
    const rng = this.createSeededRng(seed);

    const totalQuestions = examForm.questionCount;
    const selectedQuestions: any[] = [];

    // For each domain, calculate how many questions to pick
    const domainQuestionCounts: Record<string, number> = {};
    let remaining = totalQuestions;

    for (const [domainKey, weight] of Object.entries(domainWeights)) {
      const count = Math.round((weight as number) * totalQuestions);
      domainQuestionCounts[domainKey] = count;
      remaining -= count;
    }

    // Distribute remaining questions to largest domains
    if (remaining > 0) {
      const entries = Object.entries(domainWeights).sort(
        ([, a], [, b]) => (b as number) - (a as number),
      );
      for (let i = 0; i < remaining; i++) {
        domainQuestionCounts[entries[i % entries.length][0]]++;
      }
    }

    // For each domain, sample questions using seeded RNG
    for (const [domainKey, count] of Object.entries(domainQuestionCounts)) {
      const domain = await this.prisma.domain.findFirst({
        where: { blueprintId: examForm.blueprintId, key: domainKey },
      });

      if (!domain) continue;

      // Fetch all active questions in this domain
      const candidateQuestions = await this.prisma.question.findMany({
        where: {
          domainId: domain.id,
          isActive: true,
          type: { in: allowedTypes },
        },
        include: { answerOptions: true },
      });

      // Distribute this domain's questions across difficulty levels
      const qByDifficulty = this.distributeAcrossDifficulty(
        candidateQuestions,
        count as number,
        difficultyMix,
      );

      // Sample using deterministic RNG
      const sampled = this.sampleWithRng(
        qByDifficulty,
        count as number,
        rng,
      );

      selectedQuestions.push(...sampled);
    }

    // Shuffle all selected questions consistently using seed
    return this.shuffleWithRng(selectedQuestions, rng);
  }

  /**
   * Distribute candidate questions across difficulty levels according to mix
   */
  private distributeAcrossDifficulty(
    questions: any[],
    needed: number,
    difficultyMix: Record<string, number>,
  ): Record<string, any[]> {
    const byDifficulty: Record<number, any[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    // Group questions by difficulty
    for (const q of questions) {
      byDifficulty[q.difficulty]?.push(q);
    }

    // Map difficulty levels: 1-2 = easy, 3 = medium, 4-5 = hard
    const easyQs = [...(byDifficulty[1] || []), ...(byDifficulty[2] || [])];
    const mediumQs = byDifficulty[3] || [];
    const hardQs = [...(byDifficulty[4] || []), ...(byDifficulty[5] || [])];

    const result: Record<string, any[]> = {};
    result['easy'] = easyQs;
    result['medium'] = mediumQs;
    result['hard'] = hardQs;

    return result;
  }

  /**
   * Sample from difficulty distribution using seeded RNG
   */
  private sampleWithRng(
    byDifficulty: Record<string, any[]>,
    count: number,
    rng: () => number,
  ): any[] {
    const easyCount = Math.floor(count * 0.2); // 20%
    const mediumCount = Math.floor(count * 0.6); // 60%
    const hardCount = count - easyCount - mediumCount;

    const sampled: any[] = [];

    // Sample from each difficulty level
    sampled.push(...this.randomSample(byDifficulty['easy'], easyCount, rng));
    sampled.push(...this.randomSample(byDifficulty['medium'], mediumCount, rng));
    sampled.push(...this.randomSample(byDifficulty['hard'], hardCount, rng));

    return sampled;
  }

  /**
   * Reservoir sampling with seeded RNG
   */
  private randomSample(
    items: any[],
    sampleSize: number,
    rng: () => number,
  ): any[] {
    if (items.length <= sampleSize) return items;

    const sample: any[] = [];
    for (let i = 0; i < sampleSize; i++) {
      sample.push(items[i]);
    }

    for (let i = sampleSize; i < items.length; i++) {
      const j = Math.floor(rng() * (i + 1));
      if (j < sampleSize) {
        sample[j] = items[i];
      }
    }

    return sample;
  }

  /**
   * Fisher-Yates shuffle using seeded RNG
   */
  private shuffleWithRng(items: any[], rng: () => number): any[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Create a seeded PRNG (using a simple LCG for determinism)
   */
  private createSeededRng(seed: string): () => number {
    // Convert seed to number
    let state = 0;
    for (let i = 0; i < seed.length; i++) {
      state = ((state << 5) - state + seed.charCodeAt(i)) | 0;
    }

    // Linear Congruential Generator
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }
}
