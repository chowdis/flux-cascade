// Pure, client-safe car helpers — no database import here, so this can be
// imported from both Server Components and Client Components (e.g. Sidebar)
// without pulling the `pg` driver into the browser bundle.

export interface Car {
  id: number;
  name: string | null;
  model: string | null;
  trim_badging: string | null;
  vin: string;
  efficiency: number | null;
}

// TeslaMate stores `cars.model` as a short code (derived from the vehicle
// config's car_type): "3", "Y", "S", "X", or "Cybertruck".
const MODELS_WITH_PREFIX = new Set(["S", "X", "3", "Y"]);

export function formatModel(model: string | null): string | null {
  if (!model) return null;
  return MODELS_WITH_PREFIX.has(model) ? `Model ${model}` : model;
}

export function carLabel(car: Car): string {
  return [car.name, car.trim_badging ?? formatModel(car.model)]
    .filter(Boolean)
    .join(" · ");
}

export type CarModelVariant = "model3" | "modely" | "generic";

export function silhouetteVariantForModel(
  model: string | null
): CarModelVariant {
  if (model === "3" || model === "S") return "model3";
  if (model === "Y" || model === "X") return "modely";
  return "generic";
}

/**
 * Resolves the `?car=` query param to a real car ID: falls back to the
 * first car (by display_priority) if the param is missing or doesn't match
 * any car TeslaMate knows about.
 */
export function resolveCarId(
  cars: Car[],
  requestedId: string | undefined
): number | null {
  if (cars.length === 0) return null;
  const parsed = requestedId ? Number(requestedId) : NaN;
  return cars.some((c) => c.id === parsed) ? parsed : cars[0].id;
}
