import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateExamBlueprintDtoType } from './questions.dto';

@Injectable()
export class BlueprintService {
  constructor(private prisma: PrismaService) {}

  async createBlueprint(data: CreateExamBlueprintDtoType, userId: string) {
    const blueprint = await this.prisma.examBlueprint.create({
      data: {
        name: data.name,
        description: data.description,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        domainWeights: data.domainWeights,
        isActive: true,
      },
    });

    // Create domains based on weights
    const ccnaDomains = [
      { key: 'NETWORK_FUNDAMENTALS', name: 'Network Fundamentals' },
      { key: 'NETWORK_ACCESS', name: 'Network Access' },
      { key: 'IP_CONNECTIVITY', name: 'IP Connectivity' },
      { key: 'IP_SERVICES', name: 'IP Services' },
      { key: 'SECURITY_FUNDAMENTALS', name: 'Security Fundamentals' },
      { key: 'AUTOMATION_PROGRAMMABILITY', name: 'Automation & Programmability' },
    ];

    await Promise.all(
      ccnaDomains.map((d) =>
        this.prisma.domain.create({
          data: {
            blueprintId: blueprint.id,
            key: d.key as any,
            name: d.name,
            weight: data.domainWeights[d.key] || 0,
          },
        }),
      ),
    );

    return blueprint;
  }

  async getBlueprint(blueprintId: string) {
    return this.prisma.examBlueprint.findUnique({
      where: { id: blueprintId },
      include: { domains: { include: { subObjectives: true } } },
    });
  }

  async listBlueprints(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};

    return this.prisma.examBlueprint.findMany({
      where,
      include: { domains: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async addSubObjectives(
    domainId: string,
    subObjectives: Array<{ code: string; description: string }>,
  ) {
    return Promise.all(
      subObjectives.map((so) =>
        this.prisma.subObjective.create({
          data: {
            domainId,
            code: so.code,
            description: so.description,
          },
        }),
      ),
    );
  }

  async getDomain(domainId: string) {
    return this.prisma.domain.findUnique({
      where: { id: domainId },
      include: { subObjectives: true },
    });
  }
}
