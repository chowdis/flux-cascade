"use client";

import { useState } from "react";
import { CarSilhouette, type CarVisualState } from "./CarSilhouette";
import { carLabel, getTeslaCompositorUrl, silhouetteVariantForModel, type Car } from "@/lib/car";

/**
 * Tries Tesla's own (unofficial) vehicle-render image first — an actual
 * photo-realistic image of this car's real model/color/wheels. Falls back
 * to the hand-drawn CarSilhouette if the model isn't supported by that
 * service, or if the image fails to load for any reason (network issue,
 * the endpoint changing, an unmapped color, etc.).
 */
export function CarVisual({ car, state }: { car: Car; state: CarVisualState }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getTeslaCompositorUrl(car);

  if (imageUrl && !imageFailed) {
    return (
      // External, unofficial third-party host — next/image's remote-pattern
      // coupling and stricter error handling aren't a good fit here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={carLabel(car)}
        className="mx-auto w-full max-w-md"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <CarSilhouette state={state} variant={silhouetteVariantForModel(car.model)} />
  );
}
