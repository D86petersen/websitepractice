import { z } from 'zod';

export const CreateQuestionDto = z.object({
  blueprintId: z.string().cuid(),
  domainId: z.string().cuid(),
  subObjectiveId: z.string().cuid().optional(),
  stem: z.string().min(10, 'Question stem must be at least 10 characters'),
  type: z.enum(['SINGLE_CHOICE', 'MULTI_SELECT', 'DRAG_DROP_BASIC', 'SHORT_ANSWER']),
  difficulty: z.number().int().min(1).max(5),
  answerOptions: z.array(
    z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
      explanationOverride: z.string().optional(),
    }),
  ),
  explanation: z.object({
    explanationMarkdown: z.string().min(20),
    referenceLinks: z.array(z.string().url()).optional(),
  }),
});

export type CreateQuestionDtoType = z.infer<typeof CreateQuestionDto>;

export const UpdateQuestionDto = CreateQuestionDto.partial();
export type UpdateQuestionDtoType = z.infer<typeof UpdateQuestionDto>;

export const CreateExamBlueprintDto = z.object({
  name: z.string().min(5),
  description: z.string().min(10),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
  domainWeights: z.record(z.number()).refine(
    (weights) => {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      return Math.abs(sum - 1.0) < 0.01;
    },
    { message: 'Domain weights must sum to 1.0' },
  ),
});

export type CreateExamBlueprintDtoType = z.infer<typeof CreateExamBlueprintDto>;
