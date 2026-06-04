/**
 * 순수 도메인 포트 — Nest/Prisma/외부 의존 0.
 * 외부 식별자는 DID, 내부 식별자는 uuid PK (IMPLEMENTATION_PLAN §1-①).
 */
export interface UserRecord {
  id: string;
  did: string;
  preferredLanguage: string;
}

export interface CreateUserInput {
  id: string;
  did: string;
  preferredLanguage?: string;
}

export interface UserRepositoryPort {
  findByDid(did: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
}

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
