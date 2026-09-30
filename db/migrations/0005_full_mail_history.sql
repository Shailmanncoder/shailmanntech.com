-- Revisit all mailbox UIDs once to backfill messages older than the former
-- one-year import window. Existing messages are deduplicated by UID.
UPDATE admin_sync_state SET last_uid = 0;
