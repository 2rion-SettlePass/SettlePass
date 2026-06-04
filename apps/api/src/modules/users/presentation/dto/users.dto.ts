import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const usersMeQuerySchema = z.object({
  userDid: z.string().min(1),
});
export class UsersMeQueryDto extends createZodDto(usersMeQuerySchema) {}
