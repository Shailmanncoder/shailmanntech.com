-- The admin schema as it stood when versioned migrations were introduced.
-- Written with "if not exists" throughout so it also applies cleanly to the
-- production database, which already has these tables.

create table if not exists admin_messages (
  id bigserial primary key,
  uidvalidity bigint not null,
  uid bigint not null,
  message_id text,
  from_name text not null default '',
  from_email text not null default '',
  contact_name text not null default '',
  contact_email text not null default '',
  subject text not null default '',
  body text not null default '',
  source text not null default 'email',
  received_at timestamptz not null,
  status text not null default 'new',
  archived boolean not null default false,
  starred boolean not null default false,
  ai_analysis text,
  ai_analysis_at timestamptz,
  unique (uidvalidity, uid)
);
create index if not exists admin_messages_received on admin_messages (received_at desc);

-- Whether a machine sent the email.
alter table admin_messages add column if not exists automated boolean not null default false;
alter table admin_messages add column if not exists automated_reason text;
alter table admin_messages add column if not exists classified boolean not null default false;

-- Project-fit check and the reply drafted from it.
alter table admin_messages add column if not exists fit text;
alter table admin_messages add column if not exists fit_reason text;
alter table admin_messages add column if not exists smart_draft text;
alter table admin_messages add column if not exists smart_draft_at timestamptz;

create table if not exists admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists admin_replies (
  id bigserial primary key,
  message_id bigint not null references admin_messages(id) on delete cascade,
  body text not null,
  sent_at timestamptz not null default now(),
  provider_id text
);
-- Replies are recorded before sending so a retry can never send twice.
alter table admin_replies add column if not exists status text not null default 'sent';
alter table admin_replies add column if not exists idempotency_key text;
create unique index if not exists admin_replies_idempotency on admin_replies (idempotency_key);

create table if not exists rate_limit_hits (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_limit_hits_key on rate_limit_hits (key, at);

create table if not exists admin_sync_state (
  mailbox text primary key,
  uidvalidity bigint not null,
  last_uid bigint not null,
  synced_at timestamptz not null default now()
);
