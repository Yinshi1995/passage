CREATE TABLE IF NOT EXISTS cards (
  id         BIGSERIAL PRIMARY KEY,
  uid        TEXT UNIQUE NOT NULL,
  image      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
  id        BIGSERIAL PRIMARY KEY,
  card_id   BIGINT REFERENCES cards(id) ON DELETE CASCADE,
  uid       TEXT NOT NULL,
  seen_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_uid   ON cards(uid);
CREATE INDEX IF NOT EXISTS idx_visits_time ON visits(seen_at DESC);
