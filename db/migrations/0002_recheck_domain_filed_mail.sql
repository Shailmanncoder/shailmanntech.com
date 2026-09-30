-- Automated-mail rules v2 stopped hiding everyone who works at a service
-- company. Re-check mail that was filed only because of its domain; choices
-- the owner made by hand ("Marked by you") are left alone.
update admin_messages set classified = false
where automated and automated_reason = 'Service or account notice';

-- Login attempts moved to rate_limit_hits.
drop table if exists admin_login_attempts;

-- Replaced by this migration.
delete from admin_settings where key = 'classifier_version';
