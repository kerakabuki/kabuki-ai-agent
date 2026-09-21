CREATE TABLE IF NOT EXISTS reception_entries (
  number INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  event_id TEXT NOT NULL CHECK(event_id = '2026'),
  name TEXT NOT NULL,
  kana TEXT NOT NULL DEFAULT '',
  contact_method TEXT NOT NULL CHECK(contact_method IN ('post','email','none')),
  postal_code TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  address_extra TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  donation_declared INTEGER NOT NULL CHECK(donation_declared IN (0,1)),
  donor_name TEXT NOT NULL DEFAULT '',
  received INTEGER NOT NULL DEFAULT 0 CHECK(received IN (0,1)),
  amount_yen INTEGER CHECK(amount_yen IS NULL OR (amount_yen >= 0 AND amount_yen <= 100000000)),
  staff_note TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK(source IN ('qr','paper')),
  paper_ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 0,
  CHECK(received = 1 OR amount_yen IS NULL)
);
CREATE INDEX IF NOT EXISTS reception_event_number ON reception_entries(event_id, number);
CREATE TABLE IF NOT EXISTS reception_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_number INTEGER NOT NULL,
  actor TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  before_json TEXT NOT NULL,
  after_json TEXT NOT NULL
);
