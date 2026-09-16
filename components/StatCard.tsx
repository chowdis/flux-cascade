import clsx from "clsx";

// Shared tinted-badge palette for any small icon next to a stat — reused by
// StatCard here and by YearInReviewCard, so the same three tones (and only
// these three) show up anywhere a metric gets an icon treatment.
export const ICON_COLOR_CLASSES = {
  accent: { bg: "bg-accent/10", text: "text-accent" },
  accent2: { bg: "bg-accent-2/10", text: "text-accent-2" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
} as const;

export type IconColor = keyof typeof ICON_COLOR_CLASSES;
export type IconComponent = (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;

export function StatCard({
  label,
  value,
  sub,
  accent = false,
  icon: Icon,
  iconColor = "accent",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  /** Optional small badge icon shown beside the label — purely decorative. */
  icon?: IconComponent;
  iconColor?: IconColor;
}) {
  const colors = ICON_COLOR_CLASSES[iconColor];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </div>
        {Icon && (
          <div
            className={clsx(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              colors.bg,
              colors.text
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div
        className={clsx(
          "mt-2 text-2xl font-semibold",
          accent ? "text-accent" : "text-foreground"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted">{description}</p>
      )}
    </div>
  );
}

export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-surface p-5",
        className
      )}
    >
      {title && (
        <h2 className="mb-4 text-sm font-medium text-foreground">{title}</h2>
      )}
      {children}
    </div>
  );
}
