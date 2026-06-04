import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infra/prisma/prisma.service";
import type {
  CreateUserInput,
  UserRecord,
  UserRepositoryPort,
} from "../domain/user.repository.port";

/** DID→userId resolve 등 사용자 조회를 담당하는 Prisma 어댑터. */
@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async findByDid(did: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { did } });
    return user ? toUserRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? toUserRecord(user) : null;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const user = await this.prisma.user.create({
      data: {
        id: input.id,
        did: input.did,
        ...(input.preferredLanguage
          ? { preferredLanguage: input.preferredLanguage }
          : {}),
      },
    });
    return toUserRecord(user);
  }
}

function toUserRecord(user: {
  id: string;
  did: string;
  preferredLanguage: string;
}): UserRecord {
  return {
    id: user.id,
    did: user.did,
    preferredLanguage: user.preferredLanguage,
  };
}
