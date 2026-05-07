import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamsModule } from './exams/exams.module';
import { SessionsModule } from './sessions/sessions.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaService } from './common/prisma.service';
import { LoggerService } from './common/logger/logger.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    QuestionsModule,
    ExamsModule,
    SessionsModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService, LoggerService],
  exports: [PrismaService, LoggerService],
})
export class AppModule {}
