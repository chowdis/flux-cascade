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
  exterior_color: string | null;
  wheel_type: string | null;
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

// Tesla's own configurator/app image renderer — undocumented and
// unofficial, but it's what Tesla's own apps use, and it's what makes it
// possible to show an actual photorealistic render of *your* car instead
// of an icon. Only reliably supports Model 3 and Model Y; other models
// fall back to the CarSilhouette icon (see CarVisual.tsx), as does any
// network/load failure — this endpoint could change or disappear anytime.
const COMPOSITOR_MODEL_CODES: Record<string, string> = { "3": "m3", Y: "my" };

// TeslaMate's `exterior_color` is Tesla's raw vehicle_config API string
// (e.g. "SolidBlack"). These paint option codes are reverse-engineered by
// the community, not documented by Tesla, and may not cover every color —
// unmapped colors fall back to a plausible default rather than skipping
// the real photo entirely.
const PAINT_CODES: Record<string, string> = {
  SolidBlack: "PBSB",
  Black: "PBSB",
  MidnightSilverMetallic: "PMNG",
  SilverMetallic: "PMNG",
  SteelGrey: "PMNG",
  DeepBlueMetallic: "PPSB",
  Blue: "PPSB",
  PearlWhite: "PPSW",
  PearlWhiteMultiCoat: "PPSW",
  White: "PPSW",
  RedMulticoat: "PPMR",
  SolidRed: "PPMR",
  Red: "PPMR",
  UltraRed: "PPMR",
  QuicksilverMetallic: "PMTG",
  StealthGrey: "PMTG",
  DolphinGrey: "PMTG",
  MetallicBrown: "PMAB",
  Green: "PMSG",
};
const DEFAULT_PAINT_CODE = "PBSB";

const WHEEL_CODES: Record<string, string> = {
  Pinwheel18: "W38B",
  Pinwheel18CapKit: "W38B",
  Stiletto19: "W39B",
  Sportwheel19: "W39B",
  Apollo19: "W39B",
  AeroTurbine20: "WT20",
  AeroTurbine22: "WT22",
  Performancewheel20: "W32P",
  Super21Gray: "WTSG",
};
const DEFAULT_WHEEL_CODE = "W38B";

/**
 * Builds a URL for Tesla's compositor image service, or null if this
 * car's model isn't one it reliably renders (see COMPOSITOR_MODEL_CODES).
 * Callers should still handle the image failing to load (CarVisual.tsx
 * falls back to CarSilhouette in both cases).
 */
export function getTeslaCompositorUrl(car: Car, size = 800): string | null {
  const modelCode = car.model ? COMPOSITOR_MODEL_CODES[car.model] : undefined;
  if (!modelCode) return null;

  const paint =
    (car.exterior_color && PAINT_CODES[car.exterior_color]) ||
    DEFAULT_PAINT_CODE;
  const wheel =
    (car.wheel_type && WHEEL_CODES[car.wheel_type]) || DEFAULT_WHEEL_CODE;

  const params = new URLSearchParams({
    model: modelCode,
    view: "STUD_3QTR",
    size: String(size),
    bkba_opt: "1",
    options: `${paint},${wheel}`,
  });

  return `https://static-assets.tesla.com/v1/compositor/?${params.toString()}`;
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
