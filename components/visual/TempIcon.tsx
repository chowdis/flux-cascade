export function TempIcon({
  celsius,
  className,
}: {
  celsius: number | null;
  className?: string;
}) {
  if (celsius === null) return <ThermometerIcon className={className} />;
  if (celsius <= 5) return <SnowflakeIcon className={className} />;
  if (celsius >= 30) return <SunIcon className={className} />;
  return <ThermometerIcon className={className} />;
}

function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path
        d="M12 2v20M4.5 6l15 12M19.5 6l-15 12M12 2l-2.5 2M12 2l2.5 2M12 22l-2.5-2M12 22l2.5-2M4.5 6l3.2.6M4.5 6l.6-3.2M19.5 6l-3.2.6M19.5 6l-.6-3.2M4.5 18l3.2-.6M4.5 18l.6 3.2M19.5 18l-3.2-.6M19.5 18l-.6 3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThermometerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
