CREATE TABLE IF NOT EXISTS survey_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  answers TEXT NOT NULL CHECK(json_valid(answers)),
  excluded INTEGER NOT NULL DEFAULT 0 CHECK(excluded IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS survey_responses_survey ON survey_responses(survey_id, id);
