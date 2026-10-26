-- Blocked senders: an address ("name@example.com") or a whole domain
-- ("example.com", which also covers its subdomains). Mail from them is kept
-- but filed away, and they can't use the contact form or the client portal.

create table blocked_senders (
  id bigserial primary key,
  pattern text not null unique,        -- always lower-case
  note text not null default '',
  created_at timestamptz not null default now()
);

-- True when an email address matches a blocked address or domain.
create function is_blocked_sender(address text) returns boolean
language sql stable as $$
  select exists (
    select 1 from blocked_senders b
    where b.pattern = lower(trim(address))
       or (position('@' in b.pattern) = 0 and (
             right(lower(trim(address)), length(b.pattern) + 1) = '@' || b.pattern
          or right(lower(trim(address)), length(b.pattern) + 1) = '.' || b.pattern))
  )
$$;

alter table admin_messages add column blocked boolean not null default false;
create index admin_messages_blocked on admin_messages (received_at desc) where blocked;
