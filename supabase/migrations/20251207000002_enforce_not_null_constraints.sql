-- ==========================================
-- FLUX - Enforce NOT NULL Constraints
-- Created: 02:03:08 Dec 07, 2025
-- ==========================================
-- This migration ensures critical fields are never NULL:
-- - All users must have tenant_id and role_id
-- - All projects, tasks, etc. must have tenant_id
-- - Prevents data integrity issues down the line

-- ==========================================
-- STEP 1: Ensure default tenant exists
-- ==========================================
do $$
declare
  default_tenant_id uuid;
  default_role_id uuid;
begin
  -- Get or create default tenant
  select id into default_tenant_id
  from public.tenants
  where slug = 'default'
  limit 1;

  if default_tenant_id is null then
    insert into public.tenants (name, slug, plan, status)
    values ('Default Tenant', 'default', 'enterprise', 'active')
    returning id into default_tenant_id;
  end if;

  -- Get default member role
  select id into default_role_id
  from public.roles
  where name = 'member'
  limit 1;

  -- ==========================================
  -- STEP 2: Fix NULL tenant_id in profiles
  -- ==========================================
  -- Assign all profiles without tenant_id to default tenant
  update public.profiles
  set tenant_id = default_tenant_id
  where tenant_id is null;

  -- ==========================================
  -- STEP 3: Fix NULL role_id in profiles
  -- ==========================================
  -- Assign all profiles without role_id to member role
  update public.profiles
  set role_id = default_role_id
  where role_id is null;

  -- ==========================================
  -- STEP 4: Fix NULL tenant_id in projects
  -- ==========================================
  -- Assign projects to tenant based on owner
  update public.projects
  set tenant_id = (
    select tenant_id
    from public.profiles
    where profiles.id = projects.owner_id
    limit 1
  )
  where tenant_id is null
  and owner_id is not null;

  -- Assign remaining projects to default tenant
  update public.projects
  set tenant_id = default_tenant_id
  where tenant_id is null;

  -- ==========================================
  -- STEP 5: Fix NULL tenant_id in tasks
  -- ==========================================
  -- Assign tasks to tenant based on project
  update public.tasks
  set tenant_id = (
    select tenant_id
    from public.projects
    where projects.id = tasks.project_id
    limit 1
  )
  where tenant_id is null
  and project_id is not null;

  -- Assign remaining tasks to default tenant
  update public.tasks
  set tenant_id = default_tenant_id
  where tenant_id is null;

  -- ==========================================
  -- STEP 6: Fix NULL tenant_id in notifications
  -- ==========================================
  -- Assign notifications to tenant based on user
  update public.notifications
  set tenant_id = (
    select tenant_id
    from public.profiles
    where profiles.id = notifications.user_id
    limit 1
  )
  where tenant_id is null
  and user_id is not null;

  -- Assign remaining notifications to default tenant
  update public.notifications
  set tenant_id = default_tenant_id
  where tenant_id is null;

  -- ==========================================
  -- STEP 7: Fix NULL tenant_id in assets
  -- ==========================================
  -- Assign assets to tenant based on project
  update public.assets
  set tenant_id = (
    select tenant_id
    from public.projects
    where projects.id = assets.project_id
    limit 1
  )
  where tenant_id is null
  and project_id is not null;

  -- Assign remaining assets to default tenant
  update public.assets
  set tenant_id = default_tenant_id
  where tenant_id is null;

  -- ==========================================
  -- STEP 8: Fix NULL tenant_id in integrations
  -- ==========================================
  -- Assign integrations to tenant based on user
  update public.integrations
  set tenant_id = (
    select tenant_id
    from public.profiles
    where profiles.id = integrations.user_id
    limit 1
  )
  where tenant_id is null
  and user_id is not null;

  -- Assign remaining integrations to default tenant
  update public.integrations
  set tenant_id = default_tenant_id
  where tenant_id is null;

  raise notice 'All NULL values have been assigned to default tenant/role';
end $$;

-- ==========================================
-- STEP 9: Add NOT NULL constraints
-- ==========================================

-- Profiles: tenant_id and role_id are required
alter table public.profiles
  alter column tenant_id set not null,
  alter column role_id set not null,
  alter column is_super_admin set not null,
  alter column is_super_admin set default false;

-- Projects: tenant_id is required
alter table public.projects
  alter column tenant_id set not null;

-- Tasks: tenant_id is required
alter table public.tasks
  alter column tenant_id set not null;

-- Notifications: tenant_id is required
alter table public.notifications
  alter column tenant_id set not null;

-- Assets: tenant_id is required
alter table public.assets
  alter column tenant_id set not null;

-- Integrations: tenant_id is required
alter table public.integrations
  alter column tenant_id set not null;

-- ==========================================
-- STEP 10: Add default values for future inserts
-- ==========================================

-- Create function to get default tenant ID
create or replace function public.get_default_tenant_id()
returns uuid
language sql
stable
as $$
  select id from public.tenants where slug = 'default' limit 1;
$$;

-- Create function to get default role ID
create or replace function public.get_default_role_id()
returns uuid
language sql
stable
as $$
  select id from public.roles where name = 'member' limit 1;
$$;

-- ==========================================
-- STEP 11: Create trigger to auto-assign tenant/role on profile insert
-- ==========================================
create or replace function public.ensure_profile_tenant_and_role()
returns trigger
language plpgsql
as $$
declare
  default_tenant_id uuid;
  default_role_id uuid;
begin
  -- Get defaults
  default_tenant_id := public.get_default_tenant_id();
  default_role_id := public.get_default_role_id();

  -- Ensure tenant_id is set
  if new.tenant_id is null then
    new.tenant_id := default_tenant_id;
  end if;

  -- Ensure role_id is set
  if new.role_id is null then
    new.role_id := default_role_id;
  end if;

  -- Ensure is_super_admin is set
  if new.is_super_admin is null then
    new.is_super_admin := false;
  end if;

  return new;
end;
$$;

create trigger ensure_profile_tenant_and_role_trigger
  before insert or update on public.profiles
  for each row
  execute function public.ensure_profile_tenant_and_role();

-- ==========================================
-- STEP 12: Create trigger to auto-assign tenant on project insert
-- ==========================================
create or replace function public.ensure_project_tenant()
returns trigger
language plpgsql
as $$
declare
  default_tenant_id uuid;
  owner_tenant_id uuid;
begin
  -- Try to get tenant from owner
  if new.owner_id is not null then
    select tenant_id into owner_tenant_id
    from public.profiles
    where id = new.owner_id
    limit 1;
  end if;

  -- Use owner's tenant or default
  if owner_tenant_id is not null then
    new.tenant_id := owner_tenant_id;
  else
    default_tenant_id := public.get_default_tenant_id();
    new.tenant_id := default_tenant_id;
  end if;

  return new;
end;
$$;

create trigger ensure_project_tenant_trigger
  before insert or update on public.projects
  for each row
  when (new.tenant_id is null)
  execute function public.ensure_project_tenant();

-- ==========================================
-- STEP 13: Create trigger to auto-assign tenant on task insert
-- ==========================================
create or replace function public.ensure_task_tenant()
returns trigger
language plpgsql
as $$
declare
  default_tenant_id uuid;
  project_tenant_id uuid;
begin
  -- Try to get tenant from project
  if new.project_id is not null then
    select tenant_id into project_tenant_id
    from public.projects
    where id = new.project_id
    limit 1;
  end if;

  -- Use project's tenant or default
  if project_tenant_id is not null then
    new.tenant_id := project_tenant_id;
  else
    default_tenant_id := public.get_default_tenant_id();
    new.tenant_id := default_tenant_id;
  end if;

  return new;
end;
$$;

create trigger ensure_task_tenant_trigger
  before insert or update on public.tasks
  for each row
  when (new.tenant_id is null)
  execute function public.ensure_task_tenant();

-- ==========================================
-- STEP 14: Create trigger to auto-assign tenant on notification insert
-- ==========================================
create or replace function public.ensure_notification_tenant()
returns trigger
language plpgsql
as $$
declare
  default_tenant_id uuid;
  user_tenant_id uuid;
begin
  -- Try to get tenant from user
  if new.user_id is not null then
    select tenant_id into user_tenant_id
    from public.profiles
    where id = new.user_id
    limit 1;
  end if;

  -- Use user's tenant or default
  if user_tenant_id is not null then
    new.tenant_id := user_tenant_id;
  else
    default_tenant_id := public.get_default_tenant_id();
    new.tenant_id := default_tenant_id;
  end if;

  return new;
end;
$$;

create trigger ensure_notification_tenant_trigger
  before insert or update on public.notifications
  for each row
  when (new.tenant_id is null)
  execute function public.ensure_notification_tenant();

-- ==========================================
-- STEP 15: Create trigger to auto-assign tenant on asset insert
-- ==========================================
create or replace function public.ensure_asset_tenant()
returns trigger
language plpgsql
as $$
declare
  default_tenant_id uuid;
  project_tenant_id uuid;
begin
  -- Try to get tenant from project
  if new.project_id is not null then
    select tenant_id into project_tenant_id
    from public.projects
    where id = new.project_id
    limit 1;
  end if;

  -- Use project's tenant or default
  if project_tenant_id is not null then
    new.tenant_id := project_tenant_id;
  else
    default_tenant_id := public.get_default_tenant_id();
    new.tenant_id := default_tenant_id;
  end if;

  return new;
end;
$$;

create trigger ensure_asset_tenant_trigger
  before insert or update on public.assets
  for each row
  when (new.tenant_id is null)
  execute function public.ensure_asset_tenant();

-- ==========================================
-- STEP 16: Create trigger to auto-assign tenant on integration insert
-- ==========================================
create or replace function public.ensure_integration_tenant()
returns trigger
language plpgsql
as $$
declare
  default_tenant_id uuid;
  user_tenant_id uuid;
begin
  -- Try to get tenant from user
  if new.user_id is not null then
    select tenant_id into user_tenant_id
    from public.profiles
    where id = new.user_id
    limit 1;
  end if;

  -- Use user's tenant or default
  if user_tenant_id is not null then
    new.tenant_id := user_tenant_id;
  else
    default_tenant_id := public.get_default_tenant_id();
    new.tenant_id := default_tenant_id;
  end if;

  return new;
end;
$$;

create trigger ensure_integration_tenant_trigger
  before insert or update on public.integrations
  for each row
  when (new.tenant_id is null)
  execute function public.ensure_integration_tenant();

-- ==========================================
-- STEP 17: Verify no NULLs remain
-- ==========================================
do $$
declare
  profiles_without_tenant int;
  profiles_without_role int;
  projects_without_tenant int;
  tasks_without_tenant int;
begin
  select count(*) into profiles_without_tenant
  from public.profiles
  where tenant_id is null;

  select count(*) into profiles_without_role
  from public.profiles
  where role_id is null;

  select count(*) into projects_without_tenant
  from public.projects
  where tenant_id is null;

  select count(*) into tasks_without_tenant
  from public.tasks
  where tenant_id is null;

  if profiles_without_tenant > 0 then
    raise warning 'Found % profiles without tenant_id', profiles_without_tenant;
  end if;

  if profiles_without_role > 0 then
    raise warning 'Found % profiles without role_id', profiles_without_role;
  end if;

  if projects_without_tenant > 0 then
    raise warning 'Found % projects without tenant_id', projects_without_tenant;
  end if;

  if tasks_without_tenant > 0 then
    raise warning 'Found % tasks without tenant_id', tasks_without_tenant;
  end if;

  raise notice 'NOT NULL constraints enforced successfully';
  raise notice 'All triggers created to prevent future NULL values';
end $$;

-- ==========================================
-- COMMENTS
-- ==========================================
comment on function public.get_default_tenant_id() is 'Returns the default tenant ID';
comment on function public.get_default_role_id() is 'Returns the default member role ID';
comment on function public.ensure_profile_tenant_and_role() is 'Ensures profiles always have tenant_id and role_id';
comment on function public.ensure_project_tenant() is 'Ensures projects always have tenant_id';
comment on function public.ensure_task_tenant() is 'Ensures tasks always have tenant_id';
comment on function public.ensure_notification_tenant() is 'Ensures notifications always have tenant_id';
comment on function public.ensure_asset_tenant() is 'Ensures assets always have tenant_id';
comment on function public.ensure_integration_tenant() is 'Ensures integrations always have tenant_id';

-- 02:03:08 Dec 07, 2025

