import { PageHeader, StatCard, Card } from "@/components/StatCard";
import { getCars } from "@/lib/queries/cars";
import { getVehicleStatus } from "@/lib/queries/status";
import { formatDistanceToNow } from "date-fns";

const STATE_LABEL: Record<string, string> = {
  online: "Online",
  asleep: "Asleep",
  offline: "Offline",
  driving: "Driving",
  charging: "Charging",
  updating: "Updating",
  parked: "Parked",
};

export default async function OverviewPage() {
  const cars = await getCars();
  const car = cars[0];

  if (!car) {
    return (
      <div>
        <PageHeader title="Overview" />
        <Card>
          <p className="text-sm text-muted">
            No cars found in the TeslaMate database. Check your
            TESLAMATE_DB_* environment variables.
          </p>
        </Card>
      </div>
    );
  }

  const status = await getVehicleStatus(car.id);

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`${car.name ?? car.model ?? "Vehicle"} · ${car.vin}`}
      />

      {!status ? (
        <Card>
          <p className="text-sm text-muted">
            No telemetry recorded yet for this vehicle.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Status"
              value={STATE_LABEL[status.state] ?? status.state}
              sub={
                status.since
                  ? `since ${formatDistanceToNow(new Date(status.since))} ago`
                  : undefined
              }
              accent
            />
            <StatCard
              label="Battery"
              value={
                status.batteryLevel !== null ? `${status.batteryLevel}%` : "--"
              }
              sub={
                status.ratedRangeKm !== null
                  ? `${Math.round(status.ratedRangeKm)} km rated range`
                  : undefined
              }
            />
            <StatCard
              label="Odometer"
              value={
                status.odometerKm !== null
                  ? `${Math.round(status.odometerKm).toLocaleString()} km`
                  : "--"
              }
            />
            <StatCard
              label="Outside temp"
              value={
                status.outsideTempC !== null
                  ? `${status.outsideTempC.toFixed(0)}°C`
                  : "--"
              }
              sub={status.isClimateOn ? "Climate on" : undefined}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {status.activeCharge && (
              <Card title="Currently charging">
                <p className="text-sm text-foreground">
                  {status.activeCharge.address ?? "Unknown location"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Started{" "}
                  {formatDistanceToNow(new Date(status.activeCharge.startDate))}{" "}
                  ago
                  {status.activeCharge.energyAdded !== null &&
                    ` · ${status.activeCharge.energyAdded.toFixed(1)} kWh added so far`}
                </p>
              </Card>
            )}
            {status.activeDrive && (
              <Card title="Currently driving">
                <p className="text-sm text-foreground">
                  From {status.activeDrive.address ?? "unknown location"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Departed{" "}
                  {formatDistanceToNow(new Date(status.activeDrive.startDate))}{" "}
                  ago
                </p>
              </Card>
            )}
            {status.latitude !== null && status.longitude !== null && (
              <Card title="Last known location">
                <a
                  href={`https://www.google.com/maps?q=${status.latitude},${status.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {status.latitude.toFixed(5)}, {status.longitude.toFixed(5)}{" "}
                  → open in Maps
                </a>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
