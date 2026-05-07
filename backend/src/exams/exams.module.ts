import { Module } from '@nestjs/common';
import { ExamGenerationService } from './exam-generation.service';
import { ScoringService } from './scoring.service';
import { ExamFormsService } from './exam-forms.service';

@Module({
  providers: [ExamGenerationService, ScoringService, ExamFormsService],
  exports: [ExamGenerationService, ScoringService, ExamFormsService],
})
export class ExamsModule {}
