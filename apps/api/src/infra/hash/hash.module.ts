import { Global, Module } from "@nestjs/common";
import { HashService } from "./hash.service";

/** 전역 HashModule — consent/verification/review use-case 가 공유한다. */
@Global()
@Module({
  providers: [HashService],
  exports: [HashService],
})
export class HashModule {}
