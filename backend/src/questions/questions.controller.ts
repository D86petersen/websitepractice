import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RoleGuard } from '@/auth/role.guard';
import { QuestionsService } from './questions.service';
import { BlueprintService } from './blueprint.service';
import { CreateQuestionDto, CreateExamBlueprintDto } from './questions.dto';

@Controller('questions')
export class QuestionsController {
  constructor(
    private questionsService: QuestionsService,
    private blueprintService: BlueprintService,
  ) {}

  @Get(':id')
  async getQuestion(@Param('id') id: string) {
    return this.questionsService.getQuestion(id);
  }

  @Get()
  async listQuestions(
    @Query('blueprintId') blueprintId?: string,
    @Query('domainId') domainId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.questionsService.listQuestions({
      blueprintId,
      domainId,
      difficulty: difficulty ? parseInt(difficulty) : undefined,
      search,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, new RoleGuard(['ADMIN']))
  async createQuestion(@Body() data: unknown, @Req() req: any) {
    try {
      const validatedData = CreateQuestionDto.parse(data);
      return this.questionsService.createQuestion(validatedData, req.user.userId);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid input');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, new RoleGuard(['ADMIN']))
  async updateQuestion(@Param('id') id: string, @Body() data: unknown, @Req() req: any) {
    try {
      const validatedData = CreateQuestionDto.partial().parse(data);
      return this.questionsService.updateQuestion(id, validatedData, req.user.userId);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid input');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, new RoleGuard(['ADMIN']))
  async deleteQuestion(@Param('id') id: string) {
    return this.questionsService.deleteQuestion(id);
  }
}

@Controller('blueprints')
export class BlueprintController {
  constructor(private blueprintService: BlueprintService) {}

  @Get()
  async listBlueprints(@Query('active') active?: string) {
    return this.blueprintService.listBlueprints(active !== 'false');
  }

  @Get(':id')
  async getBlueprint(@Param('id') id: string) {
    return this.blueprintService.getBlueprint(id);
  }

  @Get(':id/domains')
  async getBlueprintDomains(@Param('id') id: string) {
    const blueprint = await this.blueprintService.getBlueprint(id);
    return blueprint?.domains || [];
  }

  @Post()
  @UseGuards(JwtAuthGuard, new RoleGuard(['ADMIN']))
  async createBlueprint(@Body() data: unknown, @Req() req: any) {
    try {
      const validatedData = CreateExamBlueprintDto.parse(data);
      return this.blueprintService.createBlueprint(validatedData, req.user.userId);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid input');
    }
  }

  @Post(':blueprintId/domains/:domainId/sub-objectives')
  @UseGuards(JwtAuthGuard, new RoleGuard(['ADMIN']))
  async addSubObjectives(
    @Param('domainId') domainId: string,
    @Body() data: any,
  ) {
    try {
      const valid = z.array(
        z.object({
          code: z.string(),
          description: z.string(),
        }),
      ).parse(data);
      return this.blueprintService.addSubObjectives(domainId, valid);
    } catch (error) {
      throw new BadRequestException('Invalid sub-objectives format');
    }
  }
}

import { z } from 'zod';
