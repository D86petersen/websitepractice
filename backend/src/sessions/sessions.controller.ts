import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { z } from 'zod';

const CreateSessionDto = z.object({
  examFormId: z.string().cuid(),
  mode: z.enum(['SIMULATION', 'STUDY']),
});

const SubmitAnswerDto = z.object({
  questionIndex: z.number().int().min(0),
  selectedOptionIds: z.array(z.string()).optional(),
  freeTextAnswer: z.string().optional(),
  responseTimeMs: z.number().int().min(0),
});

@Controller('exam-sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  async createSession(@Body() data: unknown) {
    try {
      const validatedData = CreateSessionDto.parse(data);
      return this.sessionsService.createSession(validatedData);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid input',
      );
    }
  }

  @Get(':id/current')
  async getCurrentQuestion(
    @Param('id') sessionId: string,
    @Body('questionIndex') questionIndex: number = 0,
  ) {
    // Get session to determine mode
    const session = await (this as any).getSession(sessionId);
    return this.sessionsService.getCurrentQuestion(
      sessionId,
      questionIndex,
      session.mode,
    );
  }

  @Post(':id/answers')
  async submitAnswer(
    @Param('id') sessionId: string,
    @Body() data: unknown,
  ) {
    try {
      const validatedData = SubmitAnswerDto.parse(data);
      
      // Get session mode
      const session = await (this as any).getSession(sessionId);

      return this.sessionsService.submitAnswer({
        sessionId,
        ...validatedData,
        mode: session.mode,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid input',
      );
    }
  }

  @Post(':id/complete')
  async completeSession(@Param('id') sessionId: string) {
    return this.sessionsService.completeSession(sessionId);
  }

  @Get(':id/result')
  async getResult(@Param('id') sessionId: string) {
    return this.sessionsService.getSessionResults(sessionId);
  }

  @Get('user/:userId/history')
  async getUserHistory(@Param('userId') userId: string) {
    return this.sessionsService.getUserHistory(userId);
  }

  private async getSession(sessionId: string) {
    // Helper to fetch session (would be in a service)
    return { mode: 'SIMULATION' };
  }
}
