import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/** 전역 PrismaModule — 모든 모듈에서 PrismaService 주입 가능. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
