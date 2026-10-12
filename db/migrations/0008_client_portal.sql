-- Client portal: accounts, sign-in codes, sessions, projects and updates.

create table clients (
  id bigserial primary key,
  email text not null unique,          -- always stored lower-case
  name text not null default '',
  password_hash text,                  -- null for Google-only accounts
  google_sub text unique,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- One-time codes emailed for verifying an account and resetting a password.
create table client_codes (
  id bigserial primary key,
  email text not null,
  purpose text not null check (purpose in ('verify', 'reset')),
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index client_codes_lookup on client_codes (email, purpose, created_at desc);

-- Sessions are random tokens; only their hash is stored.
create table client_sessions (
  id bigserial primary key,
  token_hash text not null unique,
  client_id bigint not null references clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

-- A project belongs to an email address, so requests sent before the client
-- had an account appear once they sign up with that address.
create table projects (
  id bigserial primary key,
  email text not null,
  name text not null default '',
  title text not null,
  service text not null default '',
  description text not null,
  budget text not null default '',
  company text not null default '',
  status text not null default 'submitted' check (status in
    ('submitted', 'reviewing', 'proposal', 'in_progress', 'in_review', 'completed', 'on_hold', 'declined')),
  progress int not null default 0 check (progress between 0 and 100),
  contact_submission_id bigint references contact_submissions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_email on projects (email, created_at desc);

create table project_updates (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  author text not null check (author in ('team', 'client')),
  body text not null default '',
  status text,                         -- set when the update changed the status
  progress int,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index project_updates_project on project_updates (project_id, created_at);

-- Earlier contact-form requests become projects.
insert into projects (email, name, title, service, description, budget, company,
                      contact_submission_id, created_at, updated_at)
select lower(email), name,
       'Project request — ' || service, service,
       coalesce(payload->>'message', ''), coalesce(payload->>'budget', ''),
       coalesce(payload->>'company', ''), id, created_at, created_at
from contact_submissions
where status = 'sent';
