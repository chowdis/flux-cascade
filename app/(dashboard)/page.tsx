import { PageHeader, Card } from "@/components/StatCard";
import { BatteryGauge } from "@/components/visual/BatteryGauge";
import { TempIcon } from "@/components/visual/TempIcon";
import { CarVisual } from "@/components/visual/CarVisual";
import type { CarVisualState } from "@/components/visual/CarSilhouette";
import { VehicleMap } from "@/components/VehicleMap";
import { getSelectedCar, type PageSearchParams } from "@/lib/queries/cars";
import { getVehicleStatus } from "@/lib/queries/status";
import { getAverageEfficiency } from "@/lib/queries/efficiency";
import { formatDistanceToNow } from "date-fns";

const STATE_LABEL: Record<CarVisualState, string> = {
  parked: "Parked",
  driving: "Driving",
  charging: "Charging",
  asleep: "Asleep",
  offline: "Offline",
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const { car } = await getSelectedCar(searchParams);

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

  const [status, efficiency] = await Promise.all([
    getVehicleStatus(car.id),
    getAverageEfficiency(car.id, 30),
  ]);

  if (!status) {
    return (
      <div>
        <PageHeader
          title="Overview"
          description={`${car.name ?? car.model ?? "Vehicle"} · ${car.vin}`}
        />
        <Card>
          <p className="text-sm text-muted">
            No telemetry recorded yet for this vehicle.
          </p>
        </Card>
      </div>
    );
  }

  // `states.state` is only ever online/asleep/offline — driving and
  // charging come from whether there's an open drive/charging session.
  const visualState: CarVisualState = status.activeDrive
    ? "driving"
    : status.activeCharge
      ? "charging"
      : status.state === "asleep"
        ? "asleep"
        : status.state === "offline"
          ? "offline"
          : "parked";

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`${car.name ?? car.model ?? "Vehicle"} · ${car.vin}`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="w-full max-w-sm">
              <CarVisual car={car} state={visualState} />
            </div>
            <div className="text-center sm:text-right">
              <div className="text-lg font-semibold text-foreground">
                {STATE_LABEL[visualState]}
              </div>
              {visualState === "charging" && status.activeCharge && (
                <p className="mt-1 text-sm text-muted">
                  {status.activeCharge.address ?? "Unknown location"}
                  <br />
                  Started{" "}
                  {formatDistanceToNow(
                    new Date(status.activeCharge.startDate)
                  )}{" "}
                  ago
                  {status.activeCharge.energyAdded !== null &&
                    ` · ${status.activeCharge.energyAdded.toFixed(1)} kWh added so far`}
                </p>
              )}
              {visualState === "driving" && status.activeDrive && (
                <p className="mt-1 text-sm text-muted">
                  From {status.activeDrive.address ?? "unknown location"}
                  <br />
                  Departed{" "}
                  {formatDistanceToNow(
                    new Date(status.activeDrive.startDate)
                  )}{" "}
                  ago
                </p>
              )}
              {(visualState === "parked" ||
                visualState === "asleep" ||
                visualState === "offline") &&
                status.since && (
                  <p className="mt-1 text-sm text-muted">
                    since {formatDistanceToNow(new Date(status.since))} ago
                  </p>
                )}
            </div>
          </div>
        </Card>

        {status.latitude !== null && status.longitude !== null && (
          <Card title="Last known location">
            <VehicleMap
              latitude={status.latitude}
              longitude={status.longitude}
            />
          </Card>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Battery">
          <BatteryGauge percent={status.batteryLevel} />
          {status.ratedRangeKm !== null && (
            <p className="mt-2 text-center text-xs text-muted">
              {Math.round(status.ratedRangeKm)} km rated range
            </p>
          )}
        </Card>

        <Card title="Outside temperature">
          <div className="flex h-full flex-col items-center justify-center gap-3 py-4">
            <TempIcon celsius={status.outsideTempC} className="h-12 w-12 text-accent" />
            <div className="text-4xl font-bold text-foreground">
              {status.outsideTempC !== null
                ? `${status.outsideTempC.toFixed(0)}°C`
                : "--"}
            </div>
            {status.isClimateOn && (
              <p className="text-xs text-muted">Climate on</p>
            )}
          </div>
        </Card>

        <Card title="Odometer">
          <div className="flex h-full flex-col items-center justify-center gap-3 py-4">
            <OdometerIcon className="h-12 w-12 text-accent" />
            <div className="text-4xl font-bold text-foreground">
              {status.odometerKm !== null
                ? Math.round(status.odometerKm).toLocaleString()
                : "--"}
            </div>
            <p className="text-xs text-muted">km</p>
          </div>
        </Card>

        <Card title="Efficiency">
          <div className="flex h-full flex-col items-center justify-center gap-3 py-4">
            <EfficiencyIcon className="h-12 w-12 text-accent" />
            <div className="text-4xl font-bold text-foreground">
              {efficiency.whPerKm !== null
                ? Math.round(efficiency.whPerKm)
                : "--"}
              <span className="ml-1 text-sm font-normal text-muted">
                Wh/km
              </span>
            </div>
            <p className="text-xs text-muted">last 30 days</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OdometerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 15a8 8 0 1 1 16 0" strokeLinecap="round" />
      <path d="M12 15l3.5-4.5" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function EfficiencyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
