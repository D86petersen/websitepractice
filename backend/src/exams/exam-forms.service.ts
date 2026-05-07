import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { z } from 'zod';

export const CreateExamFormDto = z.object({
  blueprintId: z.string().cuid(),
  name: z.string().min(5),
  mode: z.enum(['FIXED', 'DYNAMIC']),
  questionCount: z.number().int().min(10).max(300),
  timeLimitMinutes: z.number().int().min(30).max(360),
  isPublic: z.boolean().default(true),
  rulesJson: z.any().optional(),
});

export type CreateExamFormDtoType = z.infer<typeof CreateExamFormDto>;

@Injectable()
export class ExamFormsService {
  constructor(private prisma: PrismaService) {}

  async createExamForm(
    data: CreateExamFormDtoType,
    userId: string,
  ) {
    return this.prisma.examForm.create({
      data: {
        blueprintId: data.blueprintId,
        name: data.name,
        mode: data.mode,
        questionCount: data.questionCount,
        timeLimitMinutes: data.timeLimitMinutes,
        isPublic: data.isPublic,
        rulesJson: data.rulesJson || {},
        createdBy: userId,
      },
    });
  }

  async listExamForms(filter?: {
    blueprintId?: string;
    publicOnly?: boolean;
    skip?: number;
    take?: number;
  }) {
    const skip = filter?.skip || 0;
    const take = filter?.take || 20;

    const where: any = {};
    if (filter?.publicOnly) where.isPublic = true;
    if (filter?.blueprintId) where.blueprintId = filter.blueprintId;

    const [forms, total] = await Promise.all([
      this.prisma.examForm.findMany({
        where,
        include: { blueprint: true, _count: { select: { examFormQuestions: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.examForm.count({ where }),
    ]);

    return { forms, total, skip, take };
  }

  async getExamForm(examFormId: string) {
    return this.prisma.examForm.findUnique({
      where: { id: examFormId },
      include: { blueprint: true },
    });
  }

  async addQuestionsToFixedForm(
    examFormId: string,
    questionIds: string[],
  ) {
    const examForm = await this.getExamForm(examFormId);
    if (examForm?.mode === 'DYNAMIC') {
      throw new Error('Cannot add questions to DYNAMIC form');
    }

    return Promise.all(
      questionIds.map((qId, idx) =>
        this.prisma.examFormQuestion.create({
          data: {
            examFormId,
            questionId: qId,
            orderIndex: idx,
          },
        }),
      ),
    );
  }
}
