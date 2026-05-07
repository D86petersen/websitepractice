import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { ExamGenerationService } from '@/exams/exam-generation.service';
import { ScoringService } from '@/exams/scoring.service';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private examGenerationService: ExamGenerationService,
    private scoringService: ScoringService,
  ) {}

  /**
   * Create a new exam session
   */
  async createSession(input: {
    userId?: string;
    examFormId: string;
    mode: 'SIMULATION' | 'STUDY';
  }) {
    const examForm = await this.prisma.examForm.findUnique({
      where: { id: input.examFormId },
      include: { blueprint: true },
    });

    if (!examForm) {
      throw new Error('Exam form not found');
    }

    // Generate questions for the session
    const { questions, seed } =
      await this.examGenerationService.generateExamQuestions(input.examFormId);

    // Create session
    const session = await this.prisma.userExamSession.create({
      data: {
        userId: input.userId || null,
        examFormId: input.examFormId,
        blueprintId: examForm.blueprintId,
        mode: input.mode,
        dynamicSeed: seed,
        startedAt: new Date(),
        rawTotalCount: questions.length,
      },
    });

    // Store question set in separate records (user responses)
    // Note: for efficiency, we might prefetch in cache,
    // but we'll create empty UserResponse records here for now
    for (let i = 0; i < questions.length; i++) {
      await this.prisma.userResponse.create({
        data: {
          sessionId: session.id,
          questionId: questions[i].id,
          selectedOptionIds: JSON.stringify([]),
          responseTimeMs: 0,
          isCorrect: null, // null until answered
        },
      });
    }

    return {
      sessionId: session.id,
      examName: examForm.name,
      totalQuestions: questions.length,
      timeLimitMinutes: examForm.timeLimitMinutes,
      mode: input.mode,
      firstQuestion: this.sanitizeQuestion(questions[0], input.mode),
    };
  }

  /**
   * Get current question for a session
   */
  async getCurrentQuestion(
    sessionId: string,
    questionIndex: number,
    mode: 'SIMULATION' | 'STUDY',
  ) {
    const responses = await this.prisma.userResponse.findMany({
      where: { sessionId },
      include: { question: { include: { answerOptions: true, explanation: true } } },
      orderBy: { createdAt: 'asc' },
      skip: questionIndex,
      take: 1,
    });

    if (responses.length === 0) {
      throw new Error('Question not found');
    }

    const response = responses[0];
    return {
      questionIndex,
      totalQuestions: await this.prisma.userResponse.count({
        where: { sessionId },
      }),
      question: this.sanitizeQuestion(response.question, mode),
      userResponse: {
        selectedOptionIds: response.selectedOptionIds,
        freeTextAnswer: response.freeTextAnswer,
      },
    };
  }

  /**
   * Submit an answer for a question
   */
  async submitAnswer(input: {
    sessionId: string;
    questionIndex: number;
    selectedOptionIds?: string[];
    freeTextAnswer?: string;
    responseTimeMs: number;
    mode: 'SIMULATION' | 'STUDY';
  }) {
    const responses = await this.prisma.userResponse.findMany({
      where: { sessionId: input.sessionId },
      orderBy: { createdAt: 'asc' },
      skip: input.questionIndex,
      take: 1,
      include: { question: { include: { answerOptions: true, explanation: true } } },
    });

    if (responses.length === 0) {
      throw new Error('Question not found');
    }

    const response = responses[0];

    // Update response
    let isCorrect = null;
    if (input.mode === 'STUDY') {
      // Immediately evaluate in study mode
      const tempResponse = {
        ...response,
        selectedOptionIds: input.selectedOptionIds || [],
        freeTextAnswer: input.freeTextAnswer,
      };
      isCorrect = await this.scoringService.evaluateResponse(tempResponse);
    }

    await this.prisma.userResponse.update({
      where: { id: response.id },
      data: {
        selectedOptionIds: JSON.stringify(input.selectedOptionIds || []),
        freeTextAnswer: input.freeTextAnswer,
        responseTimeMs: input.responseTimeMs,
        isCorrect,
      },
    });

    // In STUDY mode, return the correctness and explanation
    if (input.mode === 'STUDY') {
      const correctOptionIds = response.question.answerOptions
        .filter((o: any) => o.isCorrect)
        .map((o: any) => o.id);

      return {
        isCorrect,
        correctOptionIds,
        explanation: response.question.explanation?.explanationMarkdown,
      };
    }

    // In SIMULATION mode, don't reveal correctness
    return { acknowledged: true };
  }

  /**
   * Complete a session (trigger final scoring)
   */
  async completeSession(sessionId: string) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.completedAt) {
      throw new Error('Session already completed');
    }

    // Trigger scoring
    const result = await this.scoringService.scoreSession(sessionId);

    return result;
  }

  /**
   * Get results for a completed session
   */
  async getSessionResults(sessionId: string) {
    const session = await this.prisma.userExamSession.findUnique({
      where: { id: sessionId },
      include: {
        userResponses: {
          include: {
            question: {
              include: {
                answerOptions: true,
                explanation: true,
                domain: true,
                subObjective: true,
              },
            },
          },
        },
        examForm: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.completedAt) {
      throw new Error('Session not completed');
    }

    // Build detailed review data
    const questionReviews = session.userResponses.map((response: any) => {
      const selectedOptions = (
        JSON.parse(response.selectedOptionIds || '[]') as string[]
      ).map((id) => response.question.answerOptions.find((o: any) => o.id === id));

      return {
        questionId: response.question.id,
        questionStem: response.question.stem,
        domain: response.question.domain.name,
        subObjective: response.question.subObjective?.description,
        difficulty: response.question.difficulty,
        type: response.question.type,
        your_answer: selectedOptions,
        correct_answer: response.question.answerOptions.filter(
          (o: any) => o.isCorrect,
        ),
        isCorrect: response.isCorrect,
        explanation: response.question.explanation?.explanationMarkdown,
        referenceLinks: response.question.explanation?.referenceLinks,
      };
    });

    return {
      sessionId,
      examName: session.examForm.name,
      mode: session.mode,
      totalScore: session.totalScorePercent,
      scaledScore: session.scoreScale,
      passFail: session.passFail,
      domainScores: session.domainScores,
      rawCorrectCount: session.rawCorrectCount,
      rawTotalCount: session.rawTotalCount,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      questionReviews,
      weakAreas: this.identifyWeakAreas(session.domainScores),
    };
  }

  /**
   * Get user's exam history
   */
  async getUserHistory(userId: string) {
    return this.prisma.userExamSession.findMany({
      where: { userId, completedAt: { not: null } },
      include: { examForm: true },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Sanitize question based on mode (don't leak answers in SIMULATION mode)
   */
  private sanitizeQuestion(question: any, mode: string): any {
    const sanitized = { ...question };

    if (mode === 'SIMULATION') {
      // Don't send isCorrect or other revealing info
      sanitized.answerOptions = question.answerOptions.map((o: any) => ({
        id: o.id,
        text: o.text,
        orderIndex: o.orderIndex,
        // Don't include isCorrect or explanationOverride
      }));
      delete sanitized.explanation;
    } else if (mode === 'STUDY') {
      // Send full information in STUDY mode
      sanitized.answerOptions = question.answerOptions;
    }

    return sanitized;
  }

  /**
   * Identify weak areas (domains below 70%)
   */
  private identifyWeakAreas(
    domainScores: Record<string, number>,
  ): string[] {
    return Object.entries(domainScores)
      .filter(([, score]) => score < 70)
      .map(([domain]) => domain);
  }
}
