import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateQuestionDtoType, UpdateQuestionDtoType } from './questions.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async createQuestion(data: CreateQuestionDtoType, userId: string) {
    const question = await this.prisma.question.create({
      data: {
        blueprintId: data.blueprintId,
        domainId: data.domainId,
        subObjectiveId: data.subObjectiveId || null,
        stem: data.stem,
        type: data.type,
        difficulty: data.difficulty,
        createdBy: userId,
        answerOptions: {
          create: data.answerOptions.map((opt, idx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            orderIndex: idx,
            explanationOverride: opt.explanationOverride,
          })),
        },
        explanation: {
          create: {
            explanationMarkdown: data.explanation.explanationMarkdown,
            referenceLinks: data.explanation.referenceLinks || [],
          },
        },
      },
      include: {
        answerOptions: true,
        explanation: true,
      },
    });

    return question;
  }

  async getQuestion(questionId: string) {
    return this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        answerOptions: true,
        explanation: true,
        domain: true,
        subObjective: true,
      },
    });
  }

  async listQuestions(filter: {
    blueprintId?: string;
    domainId?: string;
    difficulty?: number;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const skip = filter.skip || 0;
    const take = filter.take || 20;

    const where: any = { isActive: true };
    if (filter.blueprintId) where.blueprintId = filter.blueprintId;
    if (filter.domainId) where.domainId = filter.domainId;
    if (filter.difficulty) where.difficulty = filter.difficulty;
    if (filter.search) {
      where.stem = { contains: filter.search, mode: 'insensitive' };
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: { answerOptions: true, explanation: true, domain: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.question.count({ where }),
    ]);

    return { questions, total, skip, take };
  }

  async updateQuestion(
    questionId: string,
    data: UpdateQuestionDtoType,
    userId: string,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Only creator or admin can update
    if (question.createdBy !== userId) {
      throw new Error('Not authorized to update this question');
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        stem: data.stem,
        type: data.type,
        difficulty: data.difficulty,
        subObjectiveId: data.subObjectiveId,
      },
      include: { answerOptions: true, explanation: true },
    });
  }

  async deleteQuestion(questionId: string) {
    return this.prisma.question.update({
      where: { id: questionId },
      data: { isActive: false },
    });
  }

  async updateExplanation(
    questionId: string,
    explanationMarkdown: string,
    referenceLinks?: string[],
  ) {
    return this.prisma.questionExplanation.upsert({
      where: { questionId },
      create: {
        questionId,
        explanationMarkdown,
        referenceLinks: referenceLinks || [],
      },
      update: {
        explanationMarkdown,
        referenceLinks: referenceLinks || [],
      },
    });
  }
}
