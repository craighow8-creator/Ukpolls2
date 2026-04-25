CREATE TABLE IF NOT EXISTS local_councils (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  supported_area_label TEXT,
  nation TEXT,
  tier TEXT,
  gss_code TEXT,
  official_website TEXT,
  governance_model TEXT,
  election_model TEXT,
  next_election_date TEXT,
  source_note TEXT,
  controls_json TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  fetched_at TEXT
);

CREATE TABLE IF NOT EXISTS local_wards (
  id TEXT PRIMARY KEY,
  council_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  gss_code TEXT,
  mapit_area_id TEXT,
  aliases_json TEXT,
  notes TEXT,
  candidate_list_status TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  fetched_at TEXT,
  UNIQUE(council_id, slug),
  FOREIGN KEY (council_id) REFERENCES local_councils(id)
);

CREATE TABLE IF NOT EXISTS local_sources (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  publisher TEXT,
  source_type TEXT,
  published_at TEXT,
  retrieved_at TEXT,
  checksum TEXT,
  UNIQUE(url, label)
);

CREATE TABLE IF NOT EXISTS local_officeholders (
  id TEXT PRIMARY KEY,
  council_id TEXT NOT NULL,
  ward_id TEXT NOT NULL,
  name TEXT,
  party TEXT,
  seat_status TEXT NOT NULL,
  role TEXT,
  is_current INTEGER NOT NULL DEFAULT 1,
  source_attribution TEXT,
  primary_source_id TEXT,
  verification_status TEXT NOT NULL,
  last_checked TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (council_id) REFERENCES local_councils(id),
  FOREIGN KEY (ward_id) REFERENCES local_wards(id),
  FOREIGN KEY (primary_source_id) REFERENCES local_sources(id)
);

CREATE TABLE IF NOT EXISTS local_election_events (
  id TEXT PRIMARY KEY,
  council_id TEXT NOT NULL,
  election_date TEXT NOT NULL,
  label TEXT,
  source_system TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (council_id) REFERENCES local_councils(id)
);

CREATE TABLE IF NOT EXISTS local_ballots (
  id TEXT PRIMARY KEY,
  election_event_id TEXT NOT NULL,
  council_id TEXT NOT NULL,
  ward_id TEXT,
  ballot_paper_id TEXT,
  ballot_name TEXT,
  status TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (election_event_id) REFERENCES local_election_events(id),
  FOREIGN KEY (council_id) REFERENCES local_councils(id),
  FOREIGN KEY (ward_id) REFERENCES local_wards(id)
);

CREATE TABLE IF NOT EXISTS local_candidates (
  id TEXT PRIMARY KEY,
  ballot_id TEXT NOT NULL,
  council_id TEXT NOT NULL,
  ward_id TEXT,
  name TEXT NOT NULL,
  party TEXT,
  election_date TEXT,
  democracy_club_person_url TEXT,
  source_attribution TEXT,
  issue_statements_json TEXT,
  primary_source_id TEXT,
  verification_status TEXT NOT NULL,
  last_checked TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (ballot_id) REFERENCES local_ballots(id),
  FOREIGN KEY (council_id) REFERENCES local_councils(id),
  FOREIGN KEY (ward_id) REFERENCES local_wards(id),
  FOREIGN KEY (primary_source_id) REFERENCES local_sources(id)
);

CREATE TABLE IF NOT EXISTS local_entity_sources (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  field_scope TEXT,
  verification_status TEXT NOT NULL,
  last_checked TEXT,
  FOREIGN KEY (source_id) REFERENCES local_sources(id)
);

CREATE TABLE IF NOT EXISTS local_ingest_runs (
  id TEXT PRIMARY KEY,
  pipeline TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  rows_upserted INTEGER,
  error_summary TEXT,
  meta_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_local_wards_council_name ON local_wards(council_id, name);
CREATE INDEX IF NOT EXISTS idx_local_officeholders_ward_current ON local_officeholders(ward_id, is_current);
CREATE INDEX IF NOT EXISTS idx_local_candidates_ward_election ON local_candidates(ward_id, election_date);
CREATE INDEX IF NOT EXISTS idx_local_ballots_council_event ON local_ballots(council_id, election_event_id);
CREATE INDEX IF NOT EXISTS idx_local_entity_sources_entity ON local_entity_sources(entity_type, entity_id);
