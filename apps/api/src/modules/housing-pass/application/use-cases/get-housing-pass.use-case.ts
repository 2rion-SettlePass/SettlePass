import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateHousingPassResponse } from "@settlepass/api-contracts";
import {
  HOUSING_PASS_REPOSITORY,
  type HousingPassRepositoryPort,
} from "../../domain/housing-pass.repository.port";

/**
 * GET /housing-passes/:id — 저장된 Housing Pass 조회.
 * 응답은 create 와 동일한 형태({ housingPassId, status, credential }).
 */
@Injectable()
export class GetHousingPassUseCase {
  constructor(
    @Inject(HOUSING_PASS_REPOSITORY)
    private readonly housingPasses: HousingPassRepositoryPort,
  ) {}

  async execute(id: string): Promise<CreateHousingPassResponse> {
    const stored = await this.housingPasses.findById(id);
    if (!stored) {
      throw new NotFoundException(`housing pass not found: ${id}`);
    }

    return {
      housingPassId: stored.id,
      status: stored.status,
      credential: stored.credential,
    };
  }
}
