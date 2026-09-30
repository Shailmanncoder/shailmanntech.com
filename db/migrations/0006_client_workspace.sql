CREATE TABLE admin_leads (
  email text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','discussing','proposal','won','lost')),
  notes text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  follow_up_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_leads_followup ON admin_leads(follow_up_at) WHERE follow_up_at IS NOT NULL;
CREATE TABLE admin_templates (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO admin_templates(title,body) VALUES
('Project scope','Thanks for getting in touch. Could you share your project goals, the main features you need, your preferred timeline, and your budget range?'),
('Discovery call','Thanks for sharing your project. A short call would help us understand the requirements. Please send two or three times that work for you, including your time zone.'),
('Pricing enquiry','Thanks for your interest. Pricing depends on the scope and requirements. Please share a brief and your budget range so we can prepare an estimate.'),
('Availability','Thanks for reaching out. Please share your desired start date and deadline so we can check availability for your project.');
ALTER TABLE admin_messages ADD COLUMN mailbox text NOT NULL DEFAULT 'INBOX';
ALTER TABLE admin_messages ADD COLUMN direction text NOT NULL DEFAULT 'incoming';
ALTER TABLE admin_messages ADD COLUMN attachments jsonb NOT NULL DEFAULT '[]';
ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS admin_messages_uidvalidity_uid_key;
CREATE UNIQUE INDEX admin_messages_mailbox_uid ON admin_messages(mailbox,uidvalidity,uid);
ALTER TABLE admin_replies ADD COLUMN attachments jsonb NOT NULL DEFAULT '[]';
-- Revisit existing messages once to discover attachment metadata.
UPDATE admin_sync_state SET last_uid = 0;
