// Shared shape for any bucketed-count chart (drive distance/speed on
// Driving Habits, state-of-charge on Battery Usage Patterns, etc.), so
// HistogramChart doesn't need to import a specific feature's query module
// just for a type.
export interface HistogramBucket {
  label: string;
  count: number;
}
