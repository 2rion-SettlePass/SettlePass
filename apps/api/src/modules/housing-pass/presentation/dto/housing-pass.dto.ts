import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createHousingPassSchema = z.object({
  userId: z.string().min(1),
});
export class CreateHousingPassDto extends createZodDto(createHousingPassSchema) {}
