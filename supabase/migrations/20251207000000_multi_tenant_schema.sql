-- ==========================================
-- FLUX Multi-Tenant Schema Migration
-- Created: 01:53:54 Dec 07, 2025
-- ==========================================
-- This migration sets up comprehensive multi-tenancy with:
-- - Tenant isolation
-- - Role-based access control (RBAC)
-- - Super admin capabilities
-- - Hierarchical permission system

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==========================================
-- TENANTS TABLE
-- ==========================================
-- Represents organizations/workspaces in the multi-tenant system
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null, -- URL-friendly identifier
  domain text, -- Optional custom domain
  plan text default 'free', -- 'free', 'pro', 'enterprise'
  status text default 'active', -- 'active', 'suspended', 'cancelled'
  settings jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid -- References auth.users(id) but cannot use FK constraint in Supabase
);

-- Enable RLS
alter table public.tenants enable row level security;

-- Indexes
create index idx_tenants_slug on public.tenants(slug);
create index idx_tenants_status on public.tenants(status);

-- ==========================================
-- ROLES TABLE
-- ==========================================
-- System-wide roles with hierarchical permissions
create table public.roles (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  display_name text not null,
  description text,
  level integer not null, -- Higher number = more permissions (0-100)
  is_system boolean default false, -- System roles cannot be deleted
  permissions jsonb default '{}'::jsonb, -- Full permission set
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Insert default roles (hierarchical from lowest to highest)
insert into public.roles (name, display_name, description, level, is_system, permissions) values
  ('viewer', 'Viewer', 'Read-only access to tenant resources', 10, true, '{"read": true, "write": false, "delete": false, "admin": false, "super_admin": false}'::jsonb),
  ('member', 'Member', 'Can create and edit own content', 20, true, '{"read": true, "write": true, "delete_own": true, "admin": false, "super_admin": false}'::jsonb),
  ('editor', 'Editor', 'Can edit all content within tenant', 30, true, '{"read": true, "write": true, "delete": true, "admin": false, "super_admin": false}'::jsonb),
  ('admin', 'Admin', 'Full control within tenant', 50, true, '{"read": true, "write": true, "delete": true, "admin": true, "super_admin": false}'::jsonb),
  ('super_admin', 'Super Admin', 'Full platform control across all tenants', 100, true, '{"read": true, "write": true, "delete": true, "admin": true, "super_admin": true, "manage_tenants": true, "manage_users": true, "manage_roles": true}'::jsonb);

-- ==========================================
-- PERMISSIONS TABLE
-- ==========================================
-- Granular permissions that can be assigned to roles
create table public.permissions (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  resource text not null, -- 'tasks', 'projects', 'users', 'settings', etc.
  action text not null, -- 'create', 'read', 'update', 'delete', 'manage'
  description text,
  created_at timestamptz default now() not null
);

-- Insert common permissions
insert into public.permissions (name, resource, action, description) values
  -- Task permissions
  ('tasks.create', 'tasks', 'create', 'Create new tasks'),
  ('tasks.read', 'tasks', 'read', 'View tasks'),
  ('tasks.update', 'tasks', 'update', 'Update tasks'),
  ('tasks.delete', 'tasks', 'delete', 'Delete tasks'),
  ('tasks.assign', 'tasks', 'assign', 'Assign tasks to users'),
  -- Project permissions
  ('projects.create', 'projects', 'create', 'Create new projects'),
  ('projects.read', 'projects', 'read', 'View projects'),
  ('projects.update', 'projects', 'update', 'Update projects'),
  ('projects.delete', 'projects', 'delete', 'Delete projects'),
  ('projects.manage_members', 'projects', 'manage_members', 'Manage project members'),
  -- User permissions
  ('users.read', 'users', 'read', 'View user profiles'),
  ('users.update', 'users', 'update', 'Update user profiles'),
  ('users.invite', 'users', 'invite', 'Invite new users'),
  ('users.remove', 'users', 'remove', 'Remove users from tenant'),
  -- Tenant permissions
  ('tenant.read', 'tenant', 'read', 'View tenant settings'),
  ('tenant.update', 'tenant', 'update', 'Update tenant settings'),
  ('tenant.manage_billing', 'tenant', 'manage_billing', 'Manage billing'),
  -- Admin permissions
  ('admin.all', 'admin', 'all', 'Full administrative access'),
  ('admin.manage_roles', 'admin', 'manage_roles', 'Manage roles and permissions'),
  ('admin.manage_integrations', 'admin', 'manage_integrations', 'Manage integrations'),
  -- Super admin permissions
  ('super_admin.all', 'super_admin', 'all', 'Full platform control'),
  ('super_admin.manage_tenants', 'super_admin', 'manage_tenants', 'Manage all tenants'),
  ('super_admin.manage_users', 'super_admin', 'manage_users', 'Manage all users');

-- ==========================================
-- ROLE PERMISSIONS TABLE
-- ==========================================
-- Maps permissions to roles
create table public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Assign permissions to default roles
-- Viewer: read only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'viewer' and p.name in ('tasks.read', 'projects.read', 'users.read', 'tenant.read');

-- Member: read + write own
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'member' and p.name in (
  'tasks.create', 'tasks.read', 'tasks.update', 'tasks.assign',
  'projects.read', 'users.read', 'tenant.read'
);

-- Editor: read + write all
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'editor' and p.name in (
  'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete', 'tasks.assign',
  'projects.create', 'projects.read', 'projects.update', 'projects.delete', 'projects.manage_members',
  'users.read', 'users.update', 'tenant.read', 'tenant.update'
);

-- Admin: full tenant control
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'admin' and p.name in (
  'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete', 'tasks.assign',
  'projects.create', 'projects.read', 'projects.update', 'projects.delete', 'projects.manage_members',
  'users.read', 'users.update', 'users.invite', 'users.remove',
  'tenant.read', 'tenant.update', 'tenant.manage_billing',
  'admin.all', 'admin.manage_roles', 'admin.manage_integrations'
);

-- Super Admin: everything
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'super_admin';

-- ==========================================
-- UPDATE PROFILES TABLE
-- ==========================================
-- Add tenant_id and role_id to profiles
alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null,
  add column if not exists role_id uuid references public.roles(id) on delete set null,
  add column if not exists is_super_admin boolean default false,
  add column if not exists invited_by uuid references public.profiles(id),
  add column if not exists invited_at timestamptz,
  add column if not exists last_active_at timestamptz;

-- Indexes
create index idx_profiles_tenant_id on public.profiles(tenant_id);
create index idx_profiles_role_id on public.profiles(role_id);
create index idx_profiles_is_super_admin on public.profiles(is_super_admin);

-- ==========================================
-- UPDATE PROJECTS TABLE
-- ==========================================
-- Add tenant_id to projects
alter table public.projects
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

-- Index
create index idx_projects_tenant_id on public.projects(tenant_id);

-- ==========================================
-- UPDATE TASKS TABLE
-- ==========================================
-- Add tenant_id to tasks
alter table public.tasks
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

-- Index
create index idx_tasks_tenant_id on public.tasks(tenant_id);

-- ==========================================
-- UPDATE NOTIFICATIONS TABLE
-- ==========================================
-- Add tenant_id to notifications
alter table public.notifications
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

-- Index
create index idx_notifications_tenant_id on public.notifications(tenant_id);

-- ==========================================
-- UPDATE ASSETS TABLE
-- ==========================================
-- Add tenant_id to assets
alter table public.assets
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

-- Index
create index idx_assets_tenant_id on public.assets(tenant_id);

-- ==========================================
-- UPDATE INTEGRATIONS TABLE
-- ==========================================
-- Add tenant_id to integrations
alter table public.integrations
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

-- Index
create index idx_integrations_tenant_id on public.integrations(tenant_id);

-- ==========================================
-- TENANT MEMBERS TABLE
-- ==========================================
-- Explicit tenant membership tracking
create table public.tenant_members (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role_id uuid references public.roles(id) on delete set null,
  status text default 'active', -- 'active', 'invited', 'suspended', 'removed'
  invited_by uuid references public.profiles(id),
  invited_at timestamptz default now(),
  joined_at timestamptz,
  removed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(tenant_id, user_id)
);

-- Indexes
create index idx_tenant_members_tenant_id on public.tenant_members(tenant_id);
create index idx_tenant_members_user_id on public.tenant_members(user_id);
create index idx_tenant_members_status on public.tenant_members(status);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to get current user's tenant_id
-- Note: Functions must be in public schema, not auth schema
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- Function to check if user is super admin
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(is_super_admin, false) from public.profiles where id = auth.uid();
$$;

-- Function to check if user has permission
create or replace function public.has_permission(permission_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_role_id uuid;
  has_perm boolean;
begin
  -- Super admins have all permissions
  if public.is_super_admin() then
    return true;
  end if;

  -- Get user's role
  select role_id into user_role_id
  from public.profiles
  where id = auth.uid();

  if user_role_id is null then
    return false;
  end if;

  -- Check if role has permission
  select exists(
    select 1
    from public.role_permissions rp
    join public.permissions p on rp.permission_id = p.id
    where rp.role_id = user_role_id
    and p.name = permission_name
  ) into has_perm;

  return coalesce(has_perm, false);
end;
$$;

-- Function to check if user belongs to tenant
create or replace function public.belongs_to_tenant(check_tenant_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Super admins can access all tenants
  if public.is_super_admin() then
    return true;
  end if;

  -- Check if user belongs to tenant
  return exists(
    select 1
    from public.profiles
    where id = auth.uid()
    and tenant_id = check_tenant_id
  );
end;
$$;

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- TENANTS POLICIES
-- Super admins can see all tenants
create policy "Super admins can view all tenants"
  on public.tenants for select
  using (public.is_super_admin());

-- Users can view their own tenant
create policy "Users can view own tenant"
  on public.tenants for select
  using (id = public.current_tenant_id());

-- Super admins can manage all tenants
create policy "Super admins can manage all tenants"
  on public.tenants for all
  using (public.is_super_admin());

-- Admins can update their tenant
create policy "Admins can update own tenant"
  on public.tenants for update
  using (
    id = public.current_tenant_id()
    and public.has_permission('tenant.update')
  );

-- PROFILES POLICIES
-- Drop old policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Super admins can see all profiles
create policy "Super admins can view all profiles"
  on public.profiles for select
  using (public.is_super_admin());

-- Users can see profiles in their tenant
create policy "Users can view tenant profiles"
  on public.profiles for select
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can update profiles in their tenant
create policy "Admins can update tenant profiles"
  on public.profiles for update
  using (
    tenant_id = public.current_tenant_id()
    and public.has_permission('users.update')
  );

-- PROJECTS POLICIES
-- Drop old policies
drop policy if exists "Projects viewable by members" on public.projects;
drop policy if exists "Users can create projects" on public.projects;
drop policy if exists "Owners can update projects" on public.projects;

-- Super admins can see all projects
create policy "Super admins can view all projects"
  on public.projects for select
  using (public.is_super_admin());

-- Users can see projects in their tenant
create policy "Users can view tenant projects"
  on public.projects for select
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- Users with permission can create projects
create policy "Users can create tenant projects"
  on public.projects for insert
  with check (
    tenant_id = public.current_tenant_id()
    and public.has_permission('projects.create')
  );

-- Users can update projects in their tenant
create policy "Users can update tenant projects"
  on public.projects for update
  using (
    tenant_id = public.current_tenant_id()
    and (auth.uid() = owner_id or public.has_permission('projects.update'))
  );

-- Users can delete projects in their tenant
create policy "Users can delete tenant projects"
  on public.projects for delete
  using (
    tenant_id = public.current_tenant_id()
    and (auth.uid() = owner_id or public.has_permission('projects.delete'))
  );

-- TASKS POLICIES
-- Drop old policies
drop policy if exists "Tasks viewable by project members" on public.tasks;
drop policy if exists "Authenticated users can create tasks" on public.tasks;
drop policy if exists "Authenticated users can update tasks" on public.tasks;
drop policy if exists "Authenticated users can delete tasks" on public.tasks;

-- Super admins can see all tasks
create policy "Super admins can view all tasks"
  on public.tasks for select
  using (public.is_super_admin());

-- Users can see tasks in their tenant
create policy "Users can view tenant tasks"
  on public.tasks for select
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- Users can create tasks in their tenant
create policy "Users can create tenant tasks"
  on public.tasks for insert
  with check (
    tenant_id = public.current_tenant_id()
    and public.has_permission('tasks.create')
  );

-- Users can update tasks in their tenant
create policy "Users can update tenant tasks"
  on public.tasks for update
  using (
    tenant_id = public.current_tenant_id()
    and public.has_permission('tasks.update')
  );

-- Users can delete tasks in their tenant
create policy "Users can delete tenant tasks"
  on public.tasks for delete
  using (
    tenant_id = public.current_tenant_id()
    and public.has_permission('tasks.delete')
  );

-- NOTIFICATIONS POLICIES
-- Drop old policies
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

-- Users can see notifications in their tenant
create policy "Users can view tenant notifications"
  on public.notifications for select
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- Users can update their own notifications
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ASSETS POLICIES
-- Drop old policies
drop policy if exists "Assets viewable by project members" on public.assets;
drop policy if exists "Authenticated users can upload assets" on public.assets;

-- Users can see assets in their tenant
create policy "Users can view tenant assets"
  on public.assets for select
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- Users can upload assets in their tenant
create policy "Users can upload tenant assets"
  on public.assets for insert
  with check (
    tenant_id = public.current_tenant_id()
    and public.has_permission('projects.update')
  );

-- INTEGRATIONS POLICIES
-- Drop old policies
drop policy if exists "Users can manage own integrations" on public.integrations;

-- Users can see integrations in their tenant
create policy "Users can view tenant integrations"
  on public.integrations for select
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- Users can manage integrations in their tenant
create policy "Users can manage tenant integrations"
  on public.integrations for all
  using (
    tenant_id = public.current_tenant_id()
    and (auth.uid() = user_id or public.has_permission('admin.manage_integrations'))
  );

-- ROLES POLICIES
-- Everyone can view roles (for UI display)
create policy "Everyone can view roles"
  on public.roles for select
  using (true);

-- Only super admins can manage roles
create policy "Super admins can manage roles"
  on public.roles for all
  using (public.is_super_admin());

-- PERMISSIONS POLICIES
-- Everyone can view permissions
create policy "Everyone can view permissions"
  on public.permissions for select
  using (true);

-- Only super admins can manage permissions
create policy "Super admins can manage permissions"
  on public.permissions for all
  using (public.is_super_admin());

-- TENANT MEMBERS POLICIES
-- Users can view members of their tenant
create policy "Users can view tenant members"
  on public.tenant_members for select
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- Admins can manage tenant members
create policy "Admins can manage tenant members"
  on public.tenant_members for all
  using (
    tenant_id = public.current_tenant_id()
    and public.has_permission('users.invite')
  );

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply triggers
create trigger update_tenants_updated_at before update on public.tenants
  for each row execute function update_updated_at_column();

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_tenant_members_updated_at before update on public.tenant_members
  for each row execute function update_updated_at_column();

-- ==========================================
-- INITIAL SETUP FUNCTION
-- ==========================================
-- Function to create default tenant for super admin
create or replace function create_default_tenant_for_super_admin()
returns uuid
language plpgsql
security definer
as $$
declare
  new_tenant_id uuid;
  super_admin_role_id uuid;
begin
  -- Get super admin role
  select id into super_admin_role_id
  from public.roles
  where name = 'super_admin'
  limit 1;

  -- Create default tenant
  insert into public.tenants (name, slug, plan, status)
  values ('Default Tenant', 'default', 'enterprise', 'active')
  returning id into new_tenant_id;

  -- Update super admin profile
  update public.profiles
  set
    tenant_id = new_tenant_id,
    role_id = super_admin_role_id,
    is_super_admin = true
  where is_super_admin = true
  and tenant_id is null;

  return new_tenant_id;
end;
$$;

-- ==========================================
-- REALTIME SUBSCRIPTIONS
-- ==========================================
alter publication supabase_realtime add table public.tenants;
alter publication supabase_realtime add table public.tenant_members;

-- ==========================================
-- COMMENTS
-- ==========================================
comment on table public.tenants is 'Multi-tenant organizations/workspaces';
comment on table public.roles is 'System-wide roles with hierarchical permissions';
comment on table public.permissions is 'Granular permissions for resources';
comment on table public.role_permissions is 'Maps permissions to roles';
comment on table public.tenant_members is 'Explicit tenant membership tracking';
comment on function public.current_tenant_id() is 'Returns the current user''s tenant ID';
comment on function public.is_super_admin() is 'Checks if current user is super admin';
comment on function public.has_permission(text) is 'Checks if current user has a specific permission';
comment on function public.belongs_to_tenant(uuid) is 'Checks if current user belongs to a tenant';

-- 01:53:54 Dec 07, 2025

