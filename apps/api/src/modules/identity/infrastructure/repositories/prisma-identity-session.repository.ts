import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infra/prisma/prisma.service";
import type {
  IdentitySession,
  IdentitySessionStatus,
} from "../../domain/entities/identity-session.entity";
import type {
  CreateIdentitySessionInput,
  IdentitySessionRepositoryPort,
} from "../../domain/identity.repository.port";

/** IdentitySession Prisma 어댑터. */
@Injectable()
export class PrismaIdentitySessionRepository
  implements IdentitySessionRepositoryPort
{
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async create(input: CreateIdentitySessionInput): Promise<IdentitySession> {
    const row = await this.prisma.identitySession.create({
      data: {
        id: input.id,
        mode: input.mode,
        status: input.status,
        provider: input.provider,
      },
    });
    return toSession(row);
  }

  async findById(id: string): Promise<IdentitySession | null> {
    const row = await this.prisma.identitySession.findUnique({ where: { id } });
    return row ? toSession(row) : null;
  }

  async markCompleted(id: string, userId: string): Promise<void> {
    await this.prisma.identitySession.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date(), userId },
    });
  }
}

function toSession(row: {
  id: string;
  mode: string;
  status: string;
  provider: string | null;
  createdAt: Date;
}): IdentitySession {
  return {
    id: row.id,
    mode: row.mode,
    status: row.status as IdentitySessionStatus,
    provider: row.provider ?? undefined,
    createdAt: row.createdAt,
  };
}
