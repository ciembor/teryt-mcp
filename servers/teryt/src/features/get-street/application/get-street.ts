import type { StreetDetails } from "../domain/street-details.js";
import type { StreetDetailsRepository } from "./ports/street-details-repository.js";

type GetStreetInput = {
  readonly id: string;
};

export type GetStreetDependencies = {
  readonly streetDetailsRepository: StreetDetailsRepository;
};

type GetStreetResult = {
  readonly stateDate: string | null;
  readonly street: StreetDetails | null;
};

export async function getStreet(input: GetStreetInput, dependencies: GetStreetDependencies): Promise<GetStreetResult> {
  const id = input.id.trim();

  if (!id) {
    throw new Error("get_street requires id.");
  }

  const street = await dependencies.streetDetailsRepository.getStreet(id);

  return {
    stateDate: street?.stateDate ?? null,
    street,
  };
}
