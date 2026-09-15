"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ElevationChart } from "@/components/charts/ElevationChart";
import type { DriveElevationProfile } from "@/lib/queries/elevation";

export function TripElevationProfile({
  profiles,
}: {
  profiles: DriveElevationProfile[];
}) {
  const [selectedId, setSelectedId] = useState(profiles[0]?.driveId);
  const selected = profiles.find((p) => p.driveId === selectedId) ?? profiles[0];

  if (!selected) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <select
          value={selected.driveId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
        >
          {profiles.map((p) => (
            <option key={p.driveId} value={p.driveId}>
              {format(new Date(p.startDate), "MMM d, yyyy · HH:mm")} ·{" "}
              {p.distanceKm.toFixed(0)} km
            </option>
          ))}
        </select>
        <div className="flex gap-4 text-xs text-muted">
          {selected.ascentM !== null && <span>+{selected.ascentM} m climbed</span>}
          {selected.descentM !== null && <span>-{selected.descentM} m descended</span>}
        </div>
      </div>
      <ElevationChart points={selected.points} />
    </div>
  );
}
