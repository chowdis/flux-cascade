import type { CarModelVariant } from "@/lib/car";

export type CarVisualState =
  | "parked"
  | "driving"
  | "charging"
  | "asleep"
  | "offline";

const STATE_COLOR: Record<CarVisualState, string> = {
  parked: "#8a94a6",
  driving: "#22d3ee",
  charging: "#34d399",
  asleep: "#8a94a6",
  offline: "#f87171",
};

/**
 * Original stylized side-profile illustrations distinguishing the two
 * shapes people actually asked to tell apart: Model 3's low, continuous
 * fastback taper vs. Model Y's taller cabin and short, near-vertical
 * hatch. Not traced from any official image — proportions only, in this
 * app's own minimalist line-art style.
 */
const SHAPES: Record<
  Exclude<CarModelVariant, "generic">,
  {
    body: string;
    windshield: string;
    wheelY: number;
    wheelR: number;
    wheels: [number, number];
  }
> = {
  // Low, flat hood, then a steep windshield rake up to a fairly flat roof,
  // then one long low fastback taper down to the tail — no separate trunk
  // "box", the hallmark of the Model 3's coupe-like profile.
  model3: {
    body: `M16,58 L16,54
           C20,50 28,47 38,46
           C48,44 58,34 72,22
           C82,15 95,13 112,13
           C130,13 145,20 156,32
           C165,41 174,47 182,51
           C185,53 186,55 186,58 Z`,
    windshield: "M40,45 C50,36 62,26 70,23",
    wheelY: 58,
    wheelR: 11,
    wheels: [48, 150],
  },
  // Noticeably taller, boxier cabin with a long flat roof and a short,
  // near-vertical hatch at the rear — the crossover silhouette.
  modely: {
    body: `M16,60 L16,55
           C19,51 26,47 34,44
           C42,40 50,28 62,16
           C72,9 85,7 100,7
           C118,7 132,7 140,9
           C148,11 152,18 155,26
           C158,34 160,42 162,48
           C164,52 166,55 168,58 Z`,
    windshield: "M36,43 C44,34 54,22 60,18",
    wheelY: 60,
    wheelR: 12,
    wheels: [46, 148],
  },
};

export function CarSilhouette({
  state,
  variant = "generic",
}: {
  state: CarVisualState;
  variant?: CarModelVariant;
}) {
  const color = STATE_COLOR[state];
  const dimmed = state === "asleep" || state === "offline";
  const shape = variant === "generic" ? SHAPES.model3 : SHAPES[variant];

  return (
    <div className="relative flex justify-center">
      {state === "driving" && (
        <svg
          viewBox="0 0 60 20"
          className="absolute left-0 top-1/2 h-6 w-14 -translate-y-1/2 opacity-60"
        >
          <line x1="2" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="10" x2="26" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="14" x2="16" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      <svg
        viewBox="0 0 200 80"
        className="h-auto w-full max-w-[280px]"
        style={{ opacity: dimmed ? 0.45 : 1 }}
      >
        {/* body */}
        <path
          d={shape.body}
          fill={color}
          fillOpacity="0.22"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* windshield */}
        <path
          d={shape.windshield}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* wheels */}
        {shape.wheels.map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={shape.wheelY} r={shape.wheelR} fill="var(--surface)" stroke={color} strokeWidth="2.5" />
            <circle cx={cx} cy={shape.wheelY} r={shape.wheelR * 0.36} fill={color} />
          </g>
        ))}

        {state === "charging" && (
          <g>
            {/* kept within the 0-200 viewBox — it was previously
                positioned past x=200 and silently clipped */}
            <line x1="180" y1="40" x2="190" y2="40" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M193,29 L186,40 L191,40 L188,51 L197,38 L192,38 Z"
              fill={color}
              className="animate-pulse"
            />
          </g>
        )}

        {state === "asleep" && (
          <text x="170" y="14" fontSize="12" fill={color} fontWeight="700">
            z z
          </text>
        )}

        {state === "offline" && (
          <g stroke={color} strokeWidth="2.5" strokeLinecap="round">
            <line x1="178" y1="6" x2="196" y2="16" />
            <line x1="196" y1="6" x2="178" y2="16" />
          </g>
        )}
      </svg>
    </div>
  );
}
