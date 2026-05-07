import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { ExamsModule } from '@/exams/exams.module';

@Module({
  imports: [ExamsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
