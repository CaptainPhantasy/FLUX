# NOT NULL Constraint Enforcement

**Created:** 02:03:08 Dec 07, 2025  
**Last Updated:** 02:03:08 Dec 07, 2025

## Overview

This migration enforces NOT NULL constraints on critical fields to prevent data integrity issues. In PostgreSQL systems, leaving NULL fields when creating users causes major problems down the line.

## Critical Fields That Are Now Required

### Profiles Table
- ✅ `tenant_id` - **NOT NULL** (every user must belong to a tenant)
- ✅ `role_id` - **NOT NULL** (every user must have a role)
- ✅ `is_super_admin` - **NOT NULL** (defaults to false)

### Projects Table
- ✅ `tenant_id` - **NOT NULL** (every project must belong to a tenant)

### Tasks Table
- ✅ `tenant_id` - **NOT NULL** (every task must belong to a tenant)

### Notifications Table
- ✅ `tenant_id` - **NOT NULL** (every notification must belong to a tenant)

### Assets Table
- ✅ `tenant_id` - **NOT NULL** (every asset must belong to a tenant)

### Integrations Table
- ✅ `tenant_id` - **NOT NULL** (every integration must belong to a tenant)

## What This Migration Does

### Step 1: Fixes Existing NULL Values
- Assigns all profiles without `tenant_id` to default tenant
- Assigns all profiles without `role_id` to member role
- Assigns all projects/tasks/assets/etc. without `tenant_id` to appropriate tenant

### Step 2: Adds NOT NULL Constraints
- Prevents future inserts without these critical fields
- Database will reject any attempt to create records without required values

### Step 3: Creates Automatic Triggers
- **Profile Trigger**: Auto-assigns default tenant and role if not provided
- **Project Trigger**: Auto-assigns tenant from owner if not provided
- **Task Trigger**: Auto-assigns tenant from project if not provided
- **Notification Trigger**: Auto-assigns tenant from user if not provided
- **Asset Trigger**: Auto-assigns tenant from project if not provided
- **Integration Trigger**: Auto-assigns tenant from user if not provided

## Benefits

1. **Data Integrity**: No orphaned records without tenant/role assignments
2. **Query Performance**: No need to handle NULL cases in queries
3. **RLS Policies**: Can safely assume tenant_id is always present
4. **Prevents Bugs**: Database enforces constraints at insert time
5. **Automatic Assignment**: Triggers ensure values are always set

## Usage

### Creating a New Profile

```sql
-- These will automatically get defaults if not provided
insert into public.profiles (id, email, name)
values (gen_random_uuid(), 'user@example.com', 'John Doe');

-- tenant_id and role_id will be auto-assigned by trigger
```

### Creating a New Project

```sql
-- tenant_id will be auto-assigned from owner's tenant
insert into public.projects (name, owner_id)
values ('My Project', 'user-id-here');

-- tenant_id will be automatically set from owner's profile
```

### Creating a New Task

```sql
-- tenant_id will be auto-assigned from project's tenant
insert into public.tasks (title, project_id, status)
values ('New Task', 'project-id-here', 'todo');

-- tenant_id will be automatically set from project
```

## Migration File

Run this migration after the multi-tenant schema:

```sql
-- File: supabase/migrations/20251207000002_enforce_not_null_constraints.sql
```

## Verification

After running the migration, verify no NULLs exist:

```sql
-- Check for any remaining NULLs (should all return 0)
select count(*) from public.profiles where tenant_id is null;
select count(*) from public.profiles where role_id is null;
select count(*) from public.projects where tenant_id is null;
select count(*) from public.tasks where tenant_id is null;
select count(*) from public.notifications where tenant_id is null;
select count(*) from public.assets where tenant_id is null;
select count(*) from public.integrations where tenant_id is null;
```

## Important Notes

1. **Default Tenant**: The migration uses a tenant with slug `'default'` - ensure this exists
2. **Default Role**: The migration uses a role with name `'member'` - ensure this exists
3. **Triggers**: All triggers run BEFORE insert/update, so values are set before constraints are checked
4. **Performance**: Triggers add minimal overhead but ensure data integrity

## Troubleshooting

### "Default tenant not found" error
- Ensure a tenant with slug `'default'` exists
- Run: `select * from public.tenants where slug = 'default';`

### "Default role not found" error
- Ensure a role with name `'member'` exists
- Run: `select * from public.roles where name = 'member';`

### Constraint violation on insert
- Check that you're providing required fields OR let triggers assign defaults
- Verify triggers are active: `select * from pg_trigger where tgname like '%tenant%';`

---

**02:03:08 Dec 07, 2025**

