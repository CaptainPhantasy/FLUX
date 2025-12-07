-- Enable UUID extension (not strictly needed for gen_random_uuid but good practice)
create extension if not exists "uuid-ossp";

-- ==========================================
-- Users / Profiles
-- ==========================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text,
  name text,
  organization text,
  phone text,
  address jsonb, -- { street, city, state, zip, country }
  avatar text,
  role text default 'member', -- 'admin', 'superadmin', 'member' 
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can insert their own profile" 
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);

-- ==========================================
-- Projects
-- ==========================================
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  color text default '#8B5CF6',
  owner_id uuid references public.profiles(id),
  members uuid[] default array[]::uuid[], -- Simplified membership for now
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Projects viewable by members" on public.projects
  for select using (
    auth.uid() = owner_id or 
    auth.uid() = any(members)
  );

create policy "Users can create projects" on public.projects
  for insert with check (auth.uid() = owner_id);

create policy "Owners can update projects" on public.projects
  for update using (auth.uid() = owner_id);

-- ==========================================
-- Tasks
-- ==========================================
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  tags text[] default array[]::text[],
  due_date timestamptz,
  project_id uuid references public.projects(id) on delete cascade,
  assignee_id uuid references public.profiles(id),
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Tasks viewable by project members" on public.tasks
  for select using (
    exists (
      select 1 from public.projects
      where id = tasks.project_id
      and (owner_id = auth.uid() or auth.uid() = any(members))
    )
  );

create policy "Authenticated users can create tasks" on public.tasks
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update tasks" on public.tasks
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete tasks" on public.tasks
  for delete using (auth.role() = 'authenticated');

-- ==========================================
-- Notifications
-- ==========================================
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text not null,
  title text not null,
  description text,
  is_read boolean default false,
  context jsonb,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- ==========================================
-- Assets
-- ==========================================
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null,
  url text not null,
  size integer,
  mime_type text,
  project_id uuid references public.projects(id),
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz default now(),
  tags text[] default array[]::text[]
);

alter table public.assets enable row level security;

create policy "Assets viewable by project members" on public.assets
  for select using (
    exists (
      select 1 from public.projects
      where id = assets.project_id
      and (owner_id = auth.uid() or auth.uid() = any(members))
    )
  );

create policy "Authenticated users can upload assets" on public.assets
  for insert with check (auth.role() = 'authenticated');

-- ==========================================
-- Integrations
-- ==========================================
create table public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  type text not null,
  name text not null,
  is_connected boolean default false,
  config jsonb,
  last_sync_at timestamptz
);

alter table public.integrations enable row level security;

create policy "Users can manage own integrations" on public.integrations
  for all using (auth.uid() = user_id);

-- ==========================================
-- Realtime
-- ==========================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.notifications;
