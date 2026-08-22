-- Adds the content hash used to reject stale SafetyChecks.
-- Applied only to databases created before checked_content_hash became part of schema.d1.sql.
ALTER TABLE safety_checks ADD COLUMN checked_content_hash TEXT NOT NULL DEFAULT '';
