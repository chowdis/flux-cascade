"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { signOut } from "next-auth/react";
import { carLabel, type Car } from "@/lib/car";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: GaugeIcon },
  { href: "/charging", label: "Charging", icon: BoltIcon },
  { href: "/drives", label: "Drives", icon: RouteIcon },
  { href: "/battery", label: "Battery Health", icon: BatteryIcon },
  { href: "/idle", label: "Idle & Sleep", icon: MoonIcon },
  { href: "/updates", label: "Software Updates", icon: DownloadIcon },
];

export function Sidebar({ cars }: { cars: Car[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedId = searchParams.get("car");
  const selectedCar =
    cars.find((c) => String(c.id) === requestedId) ?? cars[0];

  function withCar(href: string, carId: number) {
    return `${href}?car=${carId}`;
  }

  function handleCarChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams);
    params.set("car", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <BoltIcon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">
            Flux Cascade
          </div>
        </div>
      </div>

      {cars.length > 0 && (
        <div className="px-3 pb-3">
          {cars.length > 1 ? (
            <select
              value={selectedCar?.id}
              onChange={handleCarChange}
              className="w-full rounded-md border border-border bg-surface-2 px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            >
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {carLabel(c)}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-1 text-xs text-muted">
              {selectedCar ? carLabel(selectedCar) : "No vehicle found"}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={
                selectedCar ? withCar(item.href, selectedCar.id) : item.href
              }
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-foreground"
        >
          <LogoutIcon className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function GaugeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
      <path d="M12 12 8 8" strokeLinecap="round" />
      <path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" strokeLinecap="round" />
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

function RouteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M6 17V13a4 4 0 0 1 4-4h4a4 4 0 0 0 4-4" strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="2" y="7" width="17" height="10" rx="2" />
      <path d="M22 10v4" strokeLinecap="round" />
      <path d="M6 10v4M10 10v4M14 10v4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
