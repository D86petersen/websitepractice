import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { BlueprintService } from './blueprint.service';
import { QuestionsController, BlueprintController } from './questions.controller';

@Module({
  controllers: [QuestionsController, BlueprintController],
  providers: [QuestionsService, BlueprintService],
  exports: [QuestionsService, BlueprintService],
})
export class QuestionsModule {}
