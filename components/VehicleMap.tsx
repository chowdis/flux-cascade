"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export function VehicleMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([latitude, longitude], 15);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width: 16px; height: 16px; border-radius: 50%;
            background: #22d3ee; border: 3px solid #0b0d10;
            box-shadow: 0 0 0 2px #22d3ee;
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([latitude, longitude], { icon }).addTo(mapRef.current);
      } else {
        mapRef.current.setView([latitude, longitude]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-56 w-full overflow-hidden rounded-lg"
      style={{ background: "var(--surface-2)" }}
    />
  );
}
