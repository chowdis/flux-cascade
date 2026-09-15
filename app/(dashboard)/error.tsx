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
          Usually this means the app can&apos;t reach the TeslaMate database,
          or a query didn&apos;t match your TeslaMate version&apos;s schema.
          The real error was logged server-side — check it with:
        </p>
        <code className="mt-2 block rounded-md bg-surface-2 px-3 py-2 text-left text-xs text-foreground">
          docker logs flux-cascade
        </code>
        {error.digest && (
          <p className="mt-2 text-xs text-muted">
            Error digest: <span className="font-mono">{error.digest}</span>
          </p>
        )}
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
