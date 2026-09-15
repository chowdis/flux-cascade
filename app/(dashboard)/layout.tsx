import { Sidebar } from "@/components/Sidebar";
import { getCars } from "@/lib/queries/cars";

// Every page here reads live data from the TeslaMate database and requires
// an authenticated session — never statically prerender any of it.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A DB error here would happen in this layout, not a child page — and
  // error.tsx in this route group only catches errors from pages below it,
  // not from its own layout. So this call is caught locally: the pages
  // underneath re-fetch (and re-throw) the same data and get the real
  // error boundary treatment.
  let carLabel = "No vehicle found";
  try {
    const cars = await getCars();
    const car = cars[0];
    if (car) {
      carLabel = [car.name, car.trim_badging ?? car.model]
        .filter(Boolean)
        .join(" · ");
    }
  } catch {
    carLabel = "Unavailable";
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar carLabel={carLabel} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
