-- Activity log: who did what in the admin, and when.
create table admin_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  action text not null,
  target text,
  details jsonb not null default '{}',
  ip text
);
create index admin_events_at on admin_events (at desc);

-- Failures worth a human's attention, shown on the admin's System page.
create table app_errors (
  id bigserial primary key,
  at timestamptz not null default now(),
  source text not null,
  message text not null,
  details jsonb not null default '{}',
  resolved boolean not null default false
);
create index app_errors_open on app_errors (at desc) where not resolved;
