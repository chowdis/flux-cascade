import { PageHeader, Card, StatCard } from "@/components/StatCard";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import {
  getLastTelemetry,
  getOpenSessions,
  getLoggingGaps,
} from "@/lib/queries/systemHealth";
import { formatDistanceToNow, format } from "date-fns";

const GAP_THRESHOLD_HOURS = 2;
const GAP_WINDOW_DAYS = 30;

export default async function SystemHealthPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);
  if (!car) return null;

  const [telemetry, openSessions, gaps] = await Promise.all([
    getLastTelemetry(car.id),
    getOpenSessions(car.id),
    getLoggingGaps(car.id, GAP_WINDOW_DAYS, GAP_THRESHOLD_HOURS),
  ]);

  const stuckCount = openSessions.filter((s) => !s.isCurrentlyTrusted).length;

  return (
    <div>
      <PageHeader
        title="System Health"
        description="Data-quality diagnostics for this car's TeslaMate feed — logging gaps and sessions that never got closed properly."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Last telemetry"
          value={
            telemetry.lastPositionDate
              ? `${formatDistanceToNow(new Date(telemetry.lastPositionDate))} ago`
              : "--"
          }
          icon={PulseIcon}
          iconColor="accent"
        />
        <StatCard
          label="Current state"
          value={telemetry.lastState ?? "--"}
          sub={
            telemetry.lastStateDate
              ? `since ${formatDistanceToNow(new Date(telemetry.lastStateDate))} ago`
              : undefined
          }
        />
        <StatCard
          label="Open sessions"
          value={String(openSessions.length)}
          sub={stuckCount > 0 ? `${stuckCount} stuck` : "none stuck"}
          icon={AlertIcon}
          iconColor={stuckCount > 0 ? "warning" : "accent2"}
        />
        <StatCard
          label={`Logging gaps (${GAP_WINDOW_DAYS}d)`}
          value={String(gaps.length)}
          sub={`over ${GAP_THRESHOLD_HOURS}h each`}
          icon={GapIcon}
          iconColor={gaps.length > 0 ? "warning" : "accent2"}
        />
      </div>

      <div className="mt-4">
        <Card title="Open sessions">
          {openSessions.length === 0 ? (
            <p className="text-sm text-muted">
              No open charging or drive sessions right now.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Started</th>
                    <th className="pb-2 font-medium">Age</th>
                    <th className="pb-2 font-medium">Last telemetry</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {openSessions.map((s) => (
                    <tr
                      key={`${s.type}-${s.id}`}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-4 align-top capitalize text-foreground">
                        {s.type}
                      </td>
                      <td className="py-3 pr-4 align-top text-foreground">
                        {format(new Date(s.startDate), "MMM d, yyyy · HH:mm")}
                      </td>
                      <td className="py-3 pr-4 align-top text-muted">
                        {formatDistanceToNow(new Date(s.startDate))}
                      </td>
                      <td className="py-3 pr-4 align-top text-muted">
                        {s.lastTelemetryDate
                          ? `${formatDistanceToNow(new Date(s.lastTelemetryDate))} ago`
                          : "never"}
                      </td>
                      <td className="py-3 text-right align-top">
                        {s.isCurrentlyTrusted ? (
                          <span className="rounded-full bg-accent-2/15 px-2.5 py-1 text-xs font-medium text-accent-2">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger">
                            Stale — not shown
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-muted">
            TeslaMate can leave a session open forever if it loses its
            connection mid-charge or mid-drive — nothing ever comes back to
            close it. Overview cross-checks recent telemetry (and, for
            drives, actual movement) before trusting an open row rather than
            showing it just because it exists, and only ever looks at the
            single newest row of each type — any others listed here are
            older stuck rows that were already invisible to it.
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title={`Logging gaps (last ${GAP_WINDOW_DAYS} days)`}>
          {gaps.length === 0 ? (
            <p className="text-sm text-muted">
              No gaps over {GAP_THRESHOLD_HOURS}h in the last {GAP_WINDOW_DAYS}{" "}
              days.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 font-medium">From</th>
                    <th className="pb-2 font-medium">To</th>
                    <th className="pb-2 text-right font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {gaps.map((g, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-4 align-top text-foreground">
                        {format(new Date(g.gapStart), "MMM d, yyyy · HH:mm")}
                      </td>
                      <td className="py-3 pr-4 align-top text-foreground">
                        {format(new Date(g.gapEnd), "MMM d, yyyy · HH:mm")}
                      </td>
                      <td className="py-3 text-right align-top font-semibold text-foreground">
                        {g.hours.toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-muted">
            A car that&apos;s online should report roughly every few minutes
            even while parked, so a multi-hour silence usually means
            TeslaMate lost its connection to the vehicle or to Tesla&apos;s
            API for a while — this is the most common cause of a stuck-open
            session above, since whatever was happening when the connection
            dropped never got a proper closing sample.
          </p>
        </Card>
      </div>
    </div>
  );
}

function PulseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M2 12h4l2-7 4 14 3-10 2 3h5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M12 3 2 20h20L12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 12h5" strokeLinecap="round" />
      <path d="M16 12h5" strokeLinecap="round" />
      <path d="M9.5 8 8 12l1.5 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M14.5 8 16 12l-1.5 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}
