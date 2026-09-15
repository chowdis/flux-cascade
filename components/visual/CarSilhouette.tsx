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

export function CarSilhouette({ state }: { state: CarVisualState }) {
  const color = STATE_COLOR[state];
  const dimmed = state === "asleep" || state === "offline";

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
        viewBox="0 0 200 70"
        className="h-auto w-full max-w-[280px]"
        style={{ opacity: dimmed ? 0.45 : 1 }}
      >
        {/* body */}
        <path
          d="M15,52 L15,44 C15,44 25,44 32,38 C42,29 58,20 78,20 L112,20
             C128,20 138,28 145,38 C152,44 165,44 175,44 L182,44
             C186,44 188,47 188,50 L188,52 Z"
          fill={color}
          fillOpacity="0.22"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* windshield */}
        <path
          d="M40,37 C50,28 62,22 76,21"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* wheels */}
        <circle cx="50" cy="52" r="11" fill="var(--surface)" stroke={color} strokeWidth="2.5" />
        <circle cx="50" cy="52" r="4" fill={color} />
        <circle cx="152" cy="52" r="11" fill="var(--surface)" stroke={color} strokeWidth="2.5" />
        <circle cx="152" cy="52" r="4" fill={color} />

        {state === "charging" && (
          <g>
            <line x1="188" y1="40" x2="200" y2="40" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M203 33 l-6 9 h5 l-4 8 9-10 h-5 z"
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
