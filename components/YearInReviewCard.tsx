import { format } from "date-fns";
import {
  Card,
  ICON_COLOR_CLASSES,
  type IconColor,
  type IconComponent,
} from "@/components/StatCard";
import type { YearInReview } from "@/lib/queries/yearInReview";

/**
 * A Spotify-Wrapped-style summary card: one big headline number (distance
 * driven) up top, then the rest of the year's stats as small icon tiles
 * below — deliberately more "special" than the plain label/value grid used
 * everywhere else on Overview, since this is the one section meant to feel
 * like a yearly recap rather than a live gauge.
 */
export function YearInReviewCard({ data }: { data: YearInReview }) {
  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <SparkleIcon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-foreground">Year in Review</h2>
          <p className="text-xs text-muted">Last 12 months</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-3xl font-bold text-foreground sm:text-4xl">
          {data.distanceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="ml-1.5 text-base font-normal text-muted">km driven</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile
          icon={RouteIcon}
          color="accent2"
          label="Drives"
          value={String(data.drives)}
        />
        <Tile
          icon={BoltIcon}
          color="accent"
          label="Energy added"
          value={`${data.energyKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
        />
        <Tile
          icon={DollarIcon}
          color="accent2"
          label="Charging cost"
          value={data.chargingCost > 0 ? `$${data.chargingCost.toFixed(2)}` : "--"}
          sub={`${data.chargingSessions} session${data.chargingSessions === 1 ? "" : "s"}`}
        />
        <Tile
          icon={TrophyIcon}
          color="warning"
          label="Longest drive"
          value={data.longestDriveKm > 0 ? `${data.longestDriveKm.toFixed(0)} km` : "--"}
          sub={
            data.longestDriveDate
              ? format(new Date(data.longestDriveDate), "MMM d")
              : undefined
          }
        />
        <Tile
          icon={MapPinIcon}
          color="accent"
          label="Most-visited place"
          value={data.topLocationName ?? "--"}
          sub={
            data.topLocationName
              ? `${Math.round(data.topLocationHours ?? 0)}h`
              : undefined
          }
        />
      </div>
    </Card>
  );
}

function Tile({
  icon: Icon,
  color,
  label,
  value,
  sub,
}: {
  icon: IconComponent;
  color: IconColor;
  label: string;
  value: string;
  sub?: string;
}) {
  const { bg, text } = ICON_COLOR_CLASSES[color];
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg} ${text}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="mt-0.5 truncate text-base font-semibold text-foreground">
          {value}
        </div>
        {sub && <div className="text-xs text-muted">{sub}</div>}
      </div>
    </div>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M12 2c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" />
    </svg>
  );
}

function RouteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M6 17V13a4 4 0 0 1 4-4h4a4 4 0 0 0 4-4" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DollarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2v20" strokeLinecap="round" />
      <path
        d="M17 6.5c0-1.7-2-3-5-3s-5 1.3-5 3 2 2.6 5 3 5 1.3 5 3-2 3-5 3-5-1.3-5-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M7 5H4a4 4 0 0 0 4 4M17 5h3a4 4 0 0 1-4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 14v3" strokeLinecap="round" />
      <path
        d="M9 20h6M9.5 20c0-1.7.7-3 2.5-3s2.5 1.3 2.5 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
