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

export function carLabel(car: Car): string {
  return [car.name, car.trim_badging ?? car.model].filter(Boolean).join(" · ");
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
