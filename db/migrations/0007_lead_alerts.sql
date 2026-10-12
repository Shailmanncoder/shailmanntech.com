-- Instant lead alerts. Website form requests are checked against the project
-- rules the moment they're submitted; the result (and the drafted reply) is
-- kept so the matching inbox email opens with it ready, without a second AI
-- call. alerted_at makes sure each lead is announced at most once.
alter table contact_submissions add column fit text;
alter table contact_submissions add column fit_reason text;
alter table contact_submissions add column smart_draft text;
alter table contact_submissions add column alerted_at timestamptz;

alter table admin_messages add column alerted_at timestamptz;
