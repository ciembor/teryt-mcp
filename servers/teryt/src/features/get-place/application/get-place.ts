import type { PlaceDetails } from "../domain/place-details.js";
import type { PlaceDetailsRepository } from "./ports/place-details-repository.js";

type GetPlaceInput = {
  readonly id: string;
};

export type GetPlaceDependencies = {
  readonly placeDetailsRepository: PlaceDetailsRepository;
};

type GetPlaceResult = {
  readonly place: PlaceDetails | null;
  readonly stateDate: string | null;
};

export async function getPlace(input: GetPlaceInput, dependencies: GetPlaceDependencies): Promise<GetPlaceResult> {
  const id = input.id.trim();

  if (!id) {
    throw new Error("get_place requires id.");
  }

  const place = await dependencies.placeDetailsRepository.getPlace(id);

  return {
    place,
    stateDate: place?.stateDate ?? null,
  };
}
