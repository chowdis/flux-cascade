# Flux Cascade

A modern, self-hosted dashboard for [TeslaMate](https://github.com/teslamate-org/teslamate) —
built to replace the default Grafana dashboards with something faster to navigate
day-to-day, behind a real login screen, safely exposed to the internet.

Reads directly from your TeslaMate Postgres database (read-only). No changes to
TeslaMate itself are required.

## Dashboards

- **Overview** — current vehicle state, battery %, odometer, last known location,
  and anything in progress (an active charge or drive).
- **Charging** — sessions, energy added and cost by month, top charging locations.
- **Drives** — recent trips and a weekly distance-vs-rated-range-used chart.
- **Battery Health** — estimated rated range at 100% charge over time, as a rough
  degradation trend (TeslaMate doesn't store a battery-health percentage directly —
  see the note on the Battery Health page for how this is derived).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Recharts · Auth.js
(single-user credentials login) · `pg` for direct Postgres access.

## Setup

### 1. Create a read-only Postgres user

Run this against your TeslaMate database (adjust the password):

```sql
CREATE USER flux_cascade_ro WITH PASSWORD 'change-me';
GRANT CONNECT ON DATABASE teslamate TO flux_cascade_ro;
GRANT USAGE ON SCHEMA public TO flux_cascade_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO flux_cascade_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO flux_cascade_ro;
```

If TeslaMate runs in Docker, you can run this from the host with:

```bash
docker exec -it teslamate-db psql -U teslamate -d teslamate
```

(swap `teslamate-db` for your actual Postgres container name).

### 2. Configure environment variables

Copy `.env.example` to `.env` (or `.env.local` for local dev) and fill it in:

```bash
cp .env.example .env
```

- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — the login for *this app*, not your Tesla
  account. Use a strong password; this is what stands between the internet and
  your car's data once it's exposed via the tunnel.
- `TESLAMATE_DB_*` — connection details for the read-only user created above.

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in.

### 4. Deploy with Docker (Unraid)

```bash
docker compose build
docker compose up -d
```

`docker-compose.yml` attaches the container to TeslaMate's Docker network
(`teslamate_default` by default) so it can reach the Postgres container by
name — check your actual network name if TeslaMate isn't using the defaults:

```bash
docker inspect <your-teslamate-db-container> --format '{{json .NetworkSettings.Networks}}'
```

Update the `networks.teslamate.name` value in `docker-compose.yml` to match,
and set `TESLAMATE_DB_HOST` in `.env` to that container's name.

The app listens on port 3000 inside the container; the compose file publishes
it on host port `3411` — change that mapping if it collides with something else
on your Unraid box.

### 5. Expose it at tesla.hidbox.net via Cloudflare Tunnel

Add an ingress rule to your `cloudflared` `config.yml` (alongside your other
subdomains), pointing at the port you published above:

```yaml
ingress:
  - hostname: tesla.hidbox.net
    service: http://localhost:3411
  # ...your other existing rules...
  - service: http_status:404
```

Then add a CNAME for `tesla` in the Cloudflare DNS dashboard pointing at your
tunnel (same pattern as your other `*.hidbox.net` subdomains), and restart
`cloudflared` to pick up the new ingress rule.

## Notes on the TeslaMate schema

The queries in `lib/queries/` target TeslaMate's schema as of roughly
v1.28–1.32 (`cars`, `states`, `positions`, `drives`, `charging_processes`,
`charges`, `addresses`). If a page errors out, check the column names against
your own database with `psql -c '\d positions'` etc. and adjust the relevant
file in `lib/queries/` — the schema has been stable for a long time but does
occasionally gain columns across versions.

Every dashboard page is a Server Component that queries Postgres directly and
is wrapped in an error boundary (`app/(dashboard)/error.tsx`) — if the database
is unreachable or a query fails, you'll get a clear on-page message instead of
a crash.

## License

Private project — all rights reserved.
