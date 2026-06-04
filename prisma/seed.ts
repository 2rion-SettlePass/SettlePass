import { PrismaClient } from "@prisma/client";
import { DEMO_USER, DEMO_VERIFIER } from "@settlepass/shared";

/**
 * Phase 1 데모 시드 (멱등).
 * phase1-demo fixture 의 DEMO_USER(Linh) / DEMO_VERIFIER(Mr. Kim) 를 upsert 한다.
 * (User.id 는 String 컬럼이라 비-uuid fixture id 를 그대로 사용 가능.)
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER.userId },
    update: {
      did: DEMO_USER.userDid,
      preferredLanguage: DEMO_USER.preferredLanguage,
    },
    create: {
      id: DEMO_USER.userId,
      did: DEMO_USER.userDid,
      preferredLanguage: DEMO_USER.preferredLanguage,
    },
  });

  const verifier = await prisma.verifier.upsert({
    where: { id: DEMO_VERIFIER.verifierId },
    update: {
      name: DEMO_VERIFIER.name,
      type: DEMO_VERIFIER.type,
      did: DEMO_VERIFIER.did,
    },
    create: {
      id: DEMO_VERIFIER.verifierId,
      name: DEMO_VERIFIER.name,
      type: DEMO_VERIFIER.type,
      did: DEMO_VERIFIER.did,
    },
  });

  console.log(`[seed] user upserted: ${user.id} (${user.did})`);
  console.log(`[seed] verifier upserted: ${verifier.id} (${verifier.did})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("[seed] failed:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
