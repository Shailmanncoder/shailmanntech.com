-- In-app notifications, shown under the bell in the admin and the client
-- portal. Each one is also sent by email by the code that creates it.

create table notifications (
  id bigserial primary key,
  audience text not null check (audience in ('admin', 'client')),
  email text,                          -- the client's address; null for admin
  kind text not null,
  title text not null,
  body text not null default '',
  link text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check ((audience = 'client') = (email is not null))
);
create index notifications_admin on notifications (created_at desc) where audience = 'admin';
create index notifications_client on notifications (email, created_at desc) where audience = 'client';
