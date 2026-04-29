CREATE TABLE IF NOT EXISTS local_results (
  id TEXT PRIMARY KEY,
  ballot_id TEXT NOT NULL,
  council_id TEXT NOT NULL,
  ward_id TEXT NOT NULL,
  candidate_id TEXT,
  candidate_name TEXT NOT NULL,
  party TEXT,
  votes INTEGER,
  elected INTEGER NOT NULL DEFAULT 0,
  turnout TEXT,
  source_attribution TEXT,
  primary_source_id TEXT,
  verification_status TEXT NOT NULL,
  last_checked TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (ballot_id) REFERENCES local_ballots(id),
  FOREIGN KEY (council_id) REFERENCES local_councils(id),
  FOREIGN KEY (ward_id) REFERENCES local_wards(id),
  FOREIGN KEY (candidate_id) REFERENCES local_candidates(id),
  FOREIGN KEY (primary_source_id) REFERENCES local_sources(id)
);

CREATE INDEX IF NOT EXISTS idx_local_results_ward ON local_results(ward_id, elected);
CREATE INDEX IF NOT EXISTS idx_local_results_ballot ON local_results(ballot_id);
CREATE INDEX IF NOT EXISTS idx_local_results_council ON local_results(council_id);
