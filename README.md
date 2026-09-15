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
- `TZ` — an IANA timezone name (e.g. `America/New_York`). Every date/time in
  the app is rendered server-side, so without this the container defaults to
  UTC no matter where you or the server actually are.

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

**Reaching TeslaMate's database** depends on how TeslaMate itself is deployed:

- **Most Unraid Community Apps installs**: TeslaMate's Postgres port (5432) is
  published straight to the host. In that case you don't need a custom Docker
  network — `docker-compose.yml` already maps `host.docker.internal` to the
  host via `extra_hosts`. Just set `TESLAMATE_DB_HOST=host.docker.internal` in
  `.env`.
- **TeslaMate deployed via its own docker-compose, on a custom network** (no
  host port published): check with `docker network ls` and
  `docker ps --format '{{.Names}}\t{{.Ports}}'`. If there's no published port
  for Postgres, uncomment the `networks:` block at the bottom of
  `docker-compose.yml`, set it to your actual network name, and set
  `TESLAMATE_DB_HOST` to the Postgres container's name.

The app listens on port 3000 inside the container; the compose file publishes
it on host port `3411` — change that mapping if it collides with something else
on your Unraid box.

**Updating after a `git pull`**: a plain `docker compose build && docker compose up -d`
can silently reuse a stale container/image instead of picking up the new code
(seen in practice with Compose Manager Plus, likely due to a Docker Compose
project-name mismatch between the plugin's managed stack and a manually-run
`docker compose` in this directory). To guarantee a clean rebuild every time:

```bash
git pull
docker compose down
docker rm -f flux-cascade 2>/dev/null
docker rmi teslamate_custom-flux-cascade 2>/dev/null  # adjust the image name if yours differs
docker compose build --no-cache
docker compose up -d
```

You can sanity-check that a rebuild actually picked up new source by grepping
the running container's compiled output for a string you know changed:

```bash
docker exec flux-cascade grep -r "<some string from the new code>" /app/.next/server/chunks/
```

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
