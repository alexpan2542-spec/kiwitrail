-- Home page access log (welcome / first-visit analytics).
-- Run against the KiwiTrail PostgreSQL database, e.g.:
--   psql "$DATABASE_URL" -f backend/sql/kiwi_home_visits.sql
--
-- `server` distinguishes rows when local dev and production share one database
-- (set from backend env, e.g. KIWI_SERVER=local or KIWI_SERVER=production).

CREATE TABLE IF NOT EXISTS kiwi_home_visits (
    id BIGSERIAL PRIMARY KEY,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    server TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    user_email TEXT,
    page TEXT NOT NULL DEFAULT 'home'
);

-- If you already created this table before `server` existed, apply:
ALTER TABLE kiwi_home_visits
    ADD COLUMN IF NOT EXISTS server TEXT;

UPDATE kiwi_home_visits
SET server = 'unknown'
WHERE server IS NULL;

ALTER TABLE kiwi_home_visits
    ALTER COLUMN server SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kiwi_home_visits_visited_at
    ON kiwi_home_visits (visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_kiwi_home_visits_server_visited_at
    ON kiwi_home_visits (server, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_kiwi_home_visits_ip_visited_at
    ON kiwi_home_visits (ip_address, visited_at DESC);
