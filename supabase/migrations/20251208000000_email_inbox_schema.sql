-- ==========================================
-- FLUX Email Inbox Schema Migration
-- Created: 18:50:31 Dec 07, 2025
-- ==========================================
-- This migration creates the email inbox system with:
-- - Email storage with tenant isolation
-- - Email account connections (SMTP/IMAP/POP3)
-- - Email metadata and content storage
-- - Support for attachments
-- - Labels and folders

-- ==========================================
-- EMAIL ACCOUNTS TABLE
-- ==========================================
-- Stores email account connection configurations
create table public.email_accounts (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, -- 'gmail', 'outlook', 'custom_smtp', 'custom_imap', 'custom_pop3'
  email_address text not null,
  display_name text,
  
  -- Connection settings (encrypted in production)
  -- SMTP settings
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_password text, -- Should be encrypted in production
  smtp_use_tls boolean default true,
  
  -- IMAP/POP3 settings
  imap_host text,
  imap_port integer,
  imap_username text,
  imap_password text, -- Should be encrypted in production
  imap_use_tls boolean default true,
  
  -- OAuth tokens (for Gmail, Outlook, etc.)
  oauth_access_token text,
  oauth_refresh_token text,
  oauth_token_expires_at timestamptz,
  
  -- Sync settings
  sync_enabled boolean default true,
  sync_frequency_minutes integer default 15,
  last_synced_at timestamptz,
  
  -- Status
  is_active boolean default true,
  connection_status text default 'disconnected', -- 'connected', 'disconnected', 'error'
  last_error text,
  
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  unique(tenant_id, email_address)
);

-- Enable RLS
alter table public.email_accounts enable row level security;

-- RLS Policies for email_accounts
create policy "Users can view own email accounts"
  on public.email_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own email accounts"
  on public.email_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own email accounts"
  on public.email_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own email accounts"
  on public.email_accounts for delete
  using (auth.uid() = user_id);

-- Indexes
create index idx_email_accounts_tenant_id on public.email_accounts(tenant_id);
create index idx_email_accounts_user_id on public.email_accounts(user_id);
create index idx_email_accounts_email_address on public.email_accounts(email_address);

-- ==========================================
-- EMAILS TABLE
-- ==========================================
-- Stores individual emails fetched from connected accounts
create table public.emails (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  account_id uuid not null references public.email_accounts(id) on delete cascade,
  
  -- Email identifiers
  message_id text, -- RFC 2822 Message-ID
  in_reply_to text, -- References to parent email
  thread_id text, -- Thread grouping
  
  -- Basic email fields
  from_address text not null,
  from_name text,
  to_addresses text[] not null default array[]::text[],
  cc_addresses text[] default array[]::text[],
  bcc_addresses text[] default array[]::text[],
  subject text not null,
  body_text text,
  body_html text,
  
  -- Metadata
  received_at timestamptz not null,
  sent_at timestamptz,
  size_bytes integer,
  
  -- Flags
  is_read boolean default false,
  is_starred boolean default false,
  is_archived boolean default false,
  is_deleted boolean default false, -- Soft delete (local only)
  
  -- Labels/Folders
  labels text[] default array[]::text[],
  folder text default 'inbox', -- 'inbox', 'sent', 'draft', 'spam', 'trash', 'archive'
  
  -- Attachments metadata (actual files stored separately)
  attachments jsonb default '[]'::jsonb, -- [{name, size, type, url}]
  
  -- Additional metadata
  headers jsonb default '{}'::jsonb, -- Full email headers
  metadata jsonb default '{}'::jsonb, -- Custom metadata
  
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- Ensure unique emails per account
  unique(account_id, message_id)
);

-- Enable RLS
alter table public.emails enable row level security;

-- RLS Policies for emails
create policy "Users can view emails from their accounts"
  on public.emails for select
  using (
    exists (
      select 1 from public.email_accounts
      where email_accounts.id = emails.account_id
      and email_accounts.user_id = auth.uid()
    )
  );

create policy "Users can insert emails to their accounts"
  on public.emails for insert
  with check (
    exists (
      select 1 from public.email_accounts
      where email_accounts.id = emails.account_id
      and email_accounts.user_id = auth.uid()
    )
  );

create policy "Users can update emails from their accounts"
  on public.emails for update
  using (
    exists (
      select 1 from public.email_accounts
      where email_accounts.id = emails.account_id
      and email_accounts.user_id = auth.uid()
    )
  );

create policy "Users can delete emails from their accounts"
  on public.emails for delete
  using (
    exists (
      select 1 from public.email_accounts
      where email_accounts.id = emails.account_id
      and email_accounts.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_emails_tenant_id on public.emails(tenant_id);
create index idx_emails_account_id on public.emails(account_id);
create index idx_emails_message_id on public.emails(message_id);
create index idx_emails_thread_id on public.emails(thread_id);
create index idx_emails_received_at on public.emails(received_at desc);
create index idx_emails_is_read on public.emails(is_read);
create index idx_emails_is_starred on public.emails(is_starred);
create index idx_emails_is_deleted on public.emails(is_deleted);
create index idx_emails_folder on public.emails(folder);
create index idx_emails_from_address on public.emails(from_address);
create index idx_emails_subject_search on public.emails using gin(to_tsvector('english', subject));
create index idx_emails_body_search on public.emails using gin(to_tsvector('english', coalesce(body_text, '')));

-- ==========================================
-- EMAIL LABELS TABLE
-- ==========================================
-- Custom labels users can create and assign to emails
create table public.email_labels (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#6366f1', -- Default violet
  created_at timestamptz default now() not null,
  
  unique(tenant_id, user_id, name)
);

-- Enable RLS
alter table public.email_labels enable row level security;

-- RLS Policies for email_labels
create policy "Users can manage own labels"
  on public.email_labels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index idx_email_labels_tenant_id on public.email_labels(tenant_id);
create index idx_email_labels_user_id on public.email_labels(user_id);

-- ==========================================
-- TRIGGERS
-- ==========================================
-- Auto-update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_email_accounts_updated_at
  before update on public.email_accounts
  for each row execute function update_updated_at_column();

create trigger update_emails_updated_at
  before update on public.emails
  for each row execute function update_updated_at_column();

-- Auto-assign tenant_id from account
create or replace function assign_email_tenant_id()
returns trigger as $$
begin
  if new.tenant_id is null then
    select tenant_id into new.tenant_id
    from public.email_accounts
    where id = new.account_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger assign_email_tenant_id_trigger
  before insert on public.emails
  for each row execute function assign_email_tenant_id();

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================
-- Get unread email count for a user
create or replace function get_unread_email_count(p_user_id uuid)
returns integer as $$
begin
  return (
    select count(*)
    from public.emails e
    join public.email_accounts ea on e.account_id = ea.id
    where ea.user_id = p_user_id
    and e.is_read = false
    and e.is_deleted = false
    and e.folder = 'inbox'
  );
end;
$$ language plpgsql security definer;

-- Search emails (full-text search)
create or replace function search_emails(
  p_user_id uuid,
  p_query text,
  p_folder text default null,
  p_limit integer default 50
)
returns setof public.emails as $$
begin
  return query
  select e.*
  from public.emails e
  join public.email_accounts ea on e.account_id = ea.id
  where ea.user_id = p_user_id
  and e.is_deleted = false
  and (p_folder is null or e.folder = p_folder)
  and (
    to_tsvector('english', coalesce(e.subject, '')) @@ plainto_tsquery('english', p_query)
    or to_tsvector('english', coalesce(e.body_text, '')) @@ plainto_tsquery('english', p_query)
    or e.from_address ilike '%' || p_query || '%'
    or e.from_name ilike '%' || p_query || '%'
  )
  order by e.received_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;

-- 18:50:31 Dec 07, 2025

