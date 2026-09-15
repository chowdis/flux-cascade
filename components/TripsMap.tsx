"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { DrivePath } from "@/lib/queries/tripmap";

export function TripsMap({ paths }: { paths: DrivePath[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;

      // Clear any previously-drawn routes (keep the base tile layer).
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      const allPoints: [number, number][] = [];
      for (const path of paths) {
        if (path.points.length < 2) continue;
        L.polyline(path.points, {
          color: "#22d3ee",
          weight: 3,
          opacity: 0.65,
        }).addTo(map);
        allPoints.push(...path.points);
      }

      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [24, 24] });
      } else {
        map.setView([0, 0], 2);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paths]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full overflow-hidden rounded-lg"
      style={{ background: "var(--surface-2)" }}
    />
  );
}
