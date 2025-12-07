-- ==========================================
-- FLUX - Migrate Existing Data to Multi-Tenant
-- Created: 01:53:54 Dec 07, 2025
-- ==========================================
-- This migration handles existing data when upgrading to multi-tenant
-- Run this AFTER 20251207000000_multi_tenant_schema.sql

-- ==========================================
-- CREATE DEFAULT TENANT FOR EXISTING USERS
-- ==========================================
-- Create a default tenant for any existing users without a tenant
do $$
declare
  default_tenant_id uuid;
  super_admin_role_id uuid;
  default_admin_role_id uuid;
begin
  -- Get role IDs
  select id into super_admin_role_id from public.roles where name = 'super_admin' limit 1;
  select id into default_admin_role_id from public.roles where name = 'admin' limit 1;

  -- Create default tenant if it doesn't exist
  insert into public.tenants (name, slug, plan, status)
  values ('Default Tenant', 'default', 'enterprise', 'active')
  on conflict (slug) do nothing
  returning id into default_tenant_id;

  -- If no default tenant was created, get existing one
  if default_tenant_id is null then
    select id into default_tenant_id from public.tenants where slug = 'default' limit 1;
  end if;

  -- Assign existing users without tenant_id to default tenant
  -- Mark users with 'superadmin' role as super admins
  update public.profiles
  set
    tenant_id = default_tenant_id,
    role_id = case
      when role = 'superadmin' or role = 'super_admin' then super_admin_role_id
      when role = 'admin' then default_admin_role_id
      else (select id from public.roles where name = 'member' limit 1)
    end,
    is_super_admin = case
      when role = 'superadmin' or role = 'super_admin' then true
      else false
    end
  where tenant_id is null;

  -- Add existing users to tenant_members
  insert into public.tenant_members (tenant_id, user_id, role_id, status, joined_at)
  select
    p.tenant_id,
    p.id,
    p.role_id,
    'active',
    p.created_at
  from public.profiles p
  where p.tenant_id is not null
  and not exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = p.tenant_id
    and tm.user_id = p.id
  );

  -- Assign existing projects to default tenant
  update public.projects
  set tenant_id = default_tenant_id
  where tenant_id is null
  and owner_id in (select id from public.profiles where tenant_id = default_tenant_id);

  -- Assign existing tasks to tenant based on project
  update public.tasks
  set tenant_id = (
    select tenant_id from public.projects
    where projects.id = tasks.project_id
    limit 1
  )
  where tenant_id is null
  and project_id is not null;

  -- Assign tasks without project to default tenant
  update public.tasks
  set tenant_id = default_tenant_id
  where tenant_id is null;

  -- Assign existing notifications to tenant based on user
  update public.notifications
  set tenant_id = (
    select tenant_id from public.profiles
    where profiles.id = notifications.user_id
    limit 1
  )
  where tenant_id is null;

  -- Assign existing assets to tenant based on project
  update public.assets
  set tenant_id = (
    select tenant_id from public.projects
    where projects.id = assets.project_id
    limit 1
  )
  where tenant_id is null
  and project_id is not null;

  -- Assign assets without project to default tenant
  update public.assets
  set tenant_id = default_tenant_id
  where tenant_id is null;

  -- Assign existing integrations to tenant based on user
  update public.integrations
  set tenant_id = (
    select tenant_id from public.profiles
    where profiles.id = integrations.user_id
    limit 1
  )
  where tenant_id is null;

  raise notice 'Migration completed: Existing data assigned to default tenant';
end $$;

-- ==========================================
-- VERIFY MIGRATION
-- ==========================================
-- Check that all data has tenant_id assigned
do $$
declare
  profiles_without_tenant int;
  projects_without_tenant int;
  tasks_without_tenant int;
begin
  select count(*) into profiles_without_tenant
  from public.profiles
  where tenant_id is null;

  select count(*) into projects_without_tenant
  from public.projects
  where tenant_id is null;

  select count(*) into tasks_without_tenant
  from public.tasks
  where tenant_id is null;

  if profiles_without_tenant > 0 then
    raise warning 'Found % profiles without tenant_id', profiles_without_tenant;
  end if;

  if projects_without_tenant > 0 then
    raise warning 'Found % projects without tenant_id', projects_without_tenant;
  end if;

  if tasks_without_tenant > 0 then
    raise warning 'Found % tasks without tenant_id', tasks_without_tenant;
  end if;

  raise notice 'Migration verification complete';
end $$;

-- 01:53:54 Dec 07, 2025

