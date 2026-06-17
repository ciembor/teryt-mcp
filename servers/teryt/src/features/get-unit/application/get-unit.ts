import type { UnitDetails } from "../domain/unit-details.js";
import type { UnitDetailsRepository } from "./ports/unit-details-repository.js";

type GetUnitInput = {
  readonly id: string;
};

export type GetUnitDependencies = {
  readonly unitDetailsRepository: UnitDetailsRepository;
};

type GetUnitResult = {
  readonly stateDate: string | null;
  readonly unit: UnitDetails | null;
};

export async function getUnit(input: GetUnitInput, dependencies: GetUnitDependencies): Promise<GetUnitResult> {
  const id = input.id.trim();

  if (!id) {
    throw new Error("get_unit requires id.");
  }

  const unit = await dependencies.unitDetailsRepository.getUnit(id);

  return {
    stateDate: unit?.stateDate ?? null,
    unit,
  };
}
