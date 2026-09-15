import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { getCars, type Car } from "@/lib/queries/cars";

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
  let cars: Car[] = [];
  try {
    cars = await getCars();
  } catch {
    // Sidebar handles an empty list gracefully; the page content below
    // will surface the real error via its own error boundary.
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      {/* useSearchParams() in Sidebar requires a Suspense boundary */}
      <Suspense>
        <Sidebar cars={cars} />
      </Suspense>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
