// Pure, client-safe car helpers — no database import here, so this can be
// imported from both Server Components and Client Components (e.g. Sidebar)
// without pulling the `pg` driver into the browser bundle.

export interface Car {
  id: number;
  name: string | null;
  model: string | null;
  trim_badging: string | null;
  marketing_name: string | null;
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
  // trim_badging is Tesla's raw internal code (e.g. "P74D") — not meant for
  // display. marketing_name is what TeslaMate derives from it ("LR AWD
  // Performance"); fall back to just the model if that wasn't computed.
  return [car.name, car.marketing_name ?? formatModel(car.model)]
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
  // Model Y's 21" Performance wheel (Überturbine, with the red brake
  // calipers) — confirmed by direct testing against the compositor.
  // TeslaMate's raw wheel_type string for this wheel isn't confirmed, so
  // this covers a few plausible spellings; the model-specific default
  // below covers it either way for this app's actual Model Y.
  Uberturbine21: "WY21P",
  Turbine21: "WY21P",
  Arachnid21: "WY21P",
};

// W38B (the universal default) renders as blacked-out wheel wells on
// Model Y specifically — confirmed by testing — so each model gets its
// own fallback for when wheel_type is missing/unmapped, tuned to look
// right for this app's actual two cars (Model Y Performance defaults to
// its correct 21" Performance wheel).
const DEFAULT_WHEEL_CODE: Record<string, string> = {
  m3: "W32P",
  my: "WY21P",
};

// ---------------------------------------------------------------------------
// 2025+ "Juniper" Model Y refresh
//
// The legacy codes above render the *pre-refresh* Model Y body. Tesla's
// current configurator (tesla.com/modely/design) drives the same compositor
// with `context=design_studio_2` and a different, `$`-prefixed option-code
// set — captured from the configurator's own image requests and then
// verified by fetching renders directly. The compositor validates the whole
// combination and returns HTTP 412 for anything it doesn't sell together
// (e.g. a Performance trim on non-Performance wheels), so every trim below
// is a complete, known-good bundle rather than mix-and-match parts.
//
// Only the Performance and base Rear-Wheel Drive trims were confirmed to
// render; every Long Range AWD combination tried was rejected, so those
// fall back to the base-trim bundle (right body, wrong wheels) — still far
// closer to reality than the pre-refresh car.
// ---------------------------------------------------------------------------

const JUNIPER_TRIMS = {
  // Performance All-Wheel Drive: 21" Arachnid 2.0 wheels, red calipers.
  performance: { trim: "$MTY70", wheel: "$WY21A" },
  // Base Rear-Wheel Drive: 18" Aperture wheels. Note its interior code
  // differs from the premium trims ($IBB6 vs $IPB8/$IPW8).
  standard: { trim: "$MTY61", wheel: "$WY18P" },
} as const;

// Juniper paint codes. Ultra Red was renamed from the legacy PPMR; the
// greys/silver moved to the PN-series. Midnight Silver (PMNG) is no longer
// offered and is rejected by the compositor, so it maps to Stealth Grey.
const JUNIPER_PAINT_CODES: Record<string, string> = {
  SolidBlack: "$PBSB",
  Black: "$PBSB",
  DeepBlueMetallic: "$PPSB",
  Blue: "$PPSB",
  PearlWhite: "$PPSW",
  PearlWhiteMultiCoat: "$PPSW",
  White: "$PPSW",
  RedMulticoat: "$PR01",
  SolidRed: "$PR01",
  Red: "$PR01",
  UltraRed: "$PR01",
  QuicksilverMetallic: "$PN00",
  StealthGrey: "$PN01",
  MidnightSilverMetallic: "$PN01",
  SilverMetallic: "$PN01",
  SteelGrey: "$PN01",
  DolphinGrey: "$PN01",
};
const JUNIPER_DEFAULT_PAINT_CODE = "$PN01";

// The compositor renders a blank shadow (no car at all) if the interior
// code is omitted, so one is always sent. TeslaMate doesn't record the
// interior colour (it's in Tesla's vehicle_config as interior_trim_type,
// but TeslaMate drops it), so this is pinned to this app's actual Model Y
// Performance: Black and White. Switch to "$IPB8" for an all-black interior.
const JUNIPER_PREMIUM_INTERIOR_CODE = "$IPW8";
const JUNIPER_STANDARD_INTERIOR_CODE = "$IBB6";

// Standard 17-character VIN: position 10 is the model-year code. Letters
// I, O, Q, U, Z and the digit 0 are never used; 2010–2030 are A–Y and
// 2031–2039 wrap to 1–9.
const VIN_YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";

export function modelYearFromVin(vin: string | null): number | null {
  if (!vin || vin.length !== 17) return null;
  const idx = VIN_YEAR_CODES.indexOf(vin.charAt(9).toUpperCase());
  return idx === -1 ? null : 2010 + idx;
}

/**
 * Whether this Model Y is the 2025+ "Juniper" refresh, judged purely by
 * VIN model year since TeslaMate stores nothing else that distinguishes
 * the two bodies. A handful of early-2025-model-year cars were still the
 * pre-refresh body; those will render as Juniper here, which is the
 * lesser evil versus showing every 2026 car as the old shape.
 */
export function isJuniperModelY(car: Pick<Car, "model" | "vin">): boolean {
  if (car.model !== "Y") return false;
  const year = modelYearFromVin(car.vin);
  return year !== null && year >= 2025;
}

function isPerformanceTrim(car: Pick<Car, "marketing_name" | "trim_badging">) {
  // TeslaMate derives marketing_name ("LR AWD Performance") from Tesla's
  // trim_badging code ("P74D"); check both so either alone is enough.
  return (
    /performance/i.test(car.marketing_name ?? "") ||
    /^P/i.test(car.trim_badging ?? "")
  );
}

function juniperOptions(car: Car): string {
  const paint =
    (car.exterior_color && JUNIPER_PAINT_CODES[car.exterior_color]) ||
    JUNIPER_DEFAULT_PAINT_CODE;
  const bundle = isPerformanceTrim(car)
    ? JUNIPER_TRIMS.performance
    : JUNIPER_TRIMS.standard;
  const interior =
    bundle === JUNIPER_TRIMS.performance
      ? JUNIPER_PREMIUM_INTERIOR_CODE
      : JUNIPER_STANDARD_INTERIOR_CODE;
  return [bundle.trim, paint, bundle.wheel, interior].join(",");
}

/**
 * Builds a URL for Tesla's compositor image service, or null if this
 * car's model isn't one it reliably renders (see COMPOSITOR_MODEL_CODES).
 * Callers should still handle the image failing to load (CarVisual.tsx
 * falls back to CarSilhouette in both cases).
 *
 * Model Y renders as the 2025+ Juniper body when the VIN says it is one
 * (see isJuniperModelY); everything else uses the legacy code set, which
 * renders the pre-refresh Model Y and the current Model 3 body. There's
 * still no known way to request the *older* pre-Highland Model 3 look.
 */
export function getTeslaCompositorUrl(car: Car, size = 800): string | null {
  const modelCode = car.model ? COMPOSITOR_MODEL_CODES[car.model] : undefined;
  if (!modelCode) return null;

  const params = new URLSearchParams({
    model: modelCode,
    view: "STUD_3QTR",
    size: String(size),
    bkba_opt: "1",
  });

  if (isJuniperModelY(car)) {
    params.set("context", "design_studio_2");
    params.set("options", juniperOptions(car));
  } else {
    const paint =
      (car.exterior_color && PAINT_CODES[car.exterior_color]) ||
      DEFAULT_PAINT_CODE;
    const wheel =
      (car.wheel_type && WHEEL_CODES[car.wheel_type]) ||
      DEFAULT_WHEEL_CODE[modelCode];
    params.set("options", `${paint},${wheel}`);
  }

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
