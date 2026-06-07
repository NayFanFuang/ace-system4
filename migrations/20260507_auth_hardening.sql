-- ACE Platform auth hardening migration
-- Safe to run more than once on PostgreSQL.

alter table auth_users
  add column if not exists token_version integer not null default 1;

update auth_users
set token_version = 1
where token_version is null;

create table if not exists auth_login_logs (
  id serial primary key,
  identifier varchar(150) not null,
  employee_code varchar(30),
  ip_address varchar(80),
  user_agent text,
  success boolean not null default false,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists ix_auth_login_logs_identifier
  on auth_login_logs(identifier);

create index if not exists ix_auth_login_logs_ip_address
  on auth_login_logs(ip_address);

create index if not exists ix_auth_login_logs_success
  on auth_login_logs(success);

create index if not exists ix_auth_login_logs_created_at
  on auth_login_logs(created_at);

create index if not exists ix_auth_login_logs_identifier_failed_window
  on auth_login_logs(identifier, created_at)
  where success = false;

create index if not exists ix_auth_login_logs_ip_failed_window
  on auth_login_logs(ip_address, created_at)
  where success = false;
