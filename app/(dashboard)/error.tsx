"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-base font-semibold text-foreground">
          Couldn&apos;t load TeslaMate data
        </h1>
        <p className="mt-2 text-sm text-muted">
          {error.message.includes("ECONNREFUSED") ||
          error.message.includes("timeout")
            ? "The app couldn't reach the TeslaMate database. Check that Postgres is running and the TESLAMATE_DB_* environment variables are correct."
            : error.message}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-accent px-3 py-2 text-sm font-medium text-black transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
