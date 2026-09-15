function levelColor(percent: number): string {
  if (percent < 5) return "#f87171"; // danger
  if (percent < 20) return "#fbbf24"; // warning
  return "#34d399"; // accent-2
}

export function BatteryGauge({ percent }: { percent: number | null }) {
  const pct = percent === null ? null : Math.max(0, Math.min(100, percent));
  const color = pct === null ? "#8a94a6" : levelColor(pct);

  // Inner cavity: x 4..100, y 4..40 (96 wide, 36 tall)
  const innerX = 4;
  const innerY = 4;
  const innerW = 96;
  const innerH = 36;
  const fillW = pct === null ? 0 : (pct / 100) * innerW;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 112 44" className="w-full max-w-[220px]">
        {/* body */}
        <rect
          x="1"
          y="1"
          width="102"
          height="42"
          rx="8"
          fill="var(--surface-2)"
          stroke="var(--border)"
          strokeWidth="2"
        />
        {/* terminal nub */}
        <rect x="104" y="15" width="7" height="14" rx="2" fill="var(--border)" />
        {/* fill */}
        <rect
          x={innerX}
          y={innerY}
          width={fillW}
          height={innerH}
          rx="5"
          fill={color}
          style={{ transition: "width 0.4s ease" }}
        />
        {/* percentage text */}
        <text
          x="53"
          y="27"
          textAnchor="middle"
          fontSize="17"
          fontWeight="700"
          fill="#0b0d10"
          stroke="white"
          strokeWidth="3"
          paintOrder="stroke"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {pct === null ? "--" : `${Math.round(pct)}%`}
        </text>
      </svg>
    </div>
  );
}
