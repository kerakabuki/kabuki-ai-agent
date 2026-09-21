ALTER TABLE reception_entries ADD COLUMN entry_kind TEXT NOT NULL DEFAULT 'visitor' CHECK(entry_kind IN ('visitor','proxy'));
ALTER TABLE reception_entries ADD COLUMN attending INTEGER NOT NULL DEFAULT 1 CHECK(attending IN (0,1));
ALTER TABLE reception_entries ADD COLUMN carrier_entry_number INTEGER REFERENCES reception_entries(number);
ALTER TABLE reception_entries ADD COLUMN contact_confirmed INTEGER NOT NULL DEFAULT 1 CHECK(contact_confirmed IN (0,1));
CREATE INDEX reception_carrier ON reception_entries(carrier_entry_number);
