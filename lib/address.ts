// Shared address formatting for anything joined against TeslaMate's
// `addresses` table (charging sessions, drives). Deliberately excludes
// postcode/country — just the street and city/state, which is what people
// actually want to glance at in these lists.

export interface AddressRow {
  name: string | null;
  house_number: string | null;
  road: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
}

export function formatLocationLine(a: AddressRow): string {
  if (a.road) return [a.house_number, a.road].filter(Boolean).join(" ");
  return a.name ?? "Unknown location";
}

export function formatCityLine(a: AddressRow): string {
  return [a.city ?? a.county, a.state].filter(Boolean).join(", ");
}
