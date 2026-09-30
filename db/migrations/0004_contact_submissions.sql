-- Every contact-form submission, saved before any email is sent, with what
-- happened to its delivery and its confirmation email. The dedupe key lets a
-- double-submitted form be recognised instead of emailed twice.
create table contact_submissions (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dedupe_key text not null,
  name text not null,
  email text not null,
  service text not null,
  payload jsonb not null,
  status text not null default 'received',
  delivery_id text,
  confirmation_status text,
  confirmation_id text,
  error text
);
create index contact_submissions_dedupe on contact_submissions (dedupe_key, created_at desc);
create index contact_submissions_created on contact_submissions (created_at desc);

-- Replies: the provider's id for each sent email (column existed, now filled).
comment on column admin_replies.provider_id is 'Resend email id';
