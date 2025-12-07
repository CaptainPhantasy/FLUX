# FLUX Supabase Multi-Tenant Setup Guide

**Created:** 01:53:54 Dec 07, 2025  
**Last Updated:** 01:53:54 Dec 07, 2025

## Overview

This document describes the multi-tenant Supabase database architecture for FLUX, including setup instructions, credential management, and security best practices.

## Database Architecture

### Multi-Tenancy Model

FLUX uses a **row-level security (RLS)** based multi-tenancy model where:

1. **Tenants** represent organizations/workspaces
2. **Users** belong to one primary tenant (with super admin access to all)
3. **Data isolation** is enforced at the database level via RLS policies
4. **Role-based access control (RBAC)** provides granular permissions

### Core Tables

#### `tenants`
- Represents organizations/workspaces
- Fields: `id`, `name`, `slug`, `domain`, `plan`, `status`, `settings`, `metadata`
- Each tenant is isolated from others

#### `roles`
- System-wide roles with hierarchical permissions
- Default roles: `viewer` (10), `member` (20), `editor` (30), `admin` (50), `super_admin` (100)
- Higher level = more permissions

#### `permissions`
- Granular permissions for resources
- Examples: `tasks.create`, `projects.read`, `users.invite`, `admin.all`

#### `role_permissions`
- Maps permissions to roles
- Many-to-many relationship

#### `profiles` (enhanced)
- User profiles with `tenant_id` and `role_id`
- `is_super_admin` flag for platform-wide access

#### `tenant_members`
- Explicit tenant membership tracking
- Supports invitation workflow

### Data Isolation

All data tables include `tenant_id`:
- `projects` → `tenant_id`
- `tasks` → `tenant_id`
- `notifications` → `tenant_id`
- `assets` → `tenant_id`
- `integrations` → `tenant_id`

## Credentials

### Location

All Supabase credentials are stored in `.env.local` (not committed to Git).

### Credential Types

#### Client-Side (Safe for Browser)
- `VITE_SUPABASE_URL` - Project URL
- `VITE_SUPABASE_ANON_KEY` - Anonymous/public key

#### Server-Side Only (NEVER expose to client)
- `SUPABASE_DB_PASSWORD` - Database password
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)
- `SUPABASE_JWT_SECRET` - JWT signing secret
- `SUPABASE_SECRET_KEY` - Admin secret key

### Your Credentials

```
Project URL: https://hhyirucmlpsibkckrhtc.supabase.co
Database Password: GGLjFikgs9b2wI1S
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT Secret: yhpYYfTfEiaF3EKE9CxvQTAniLvuSZkCI+...
Publishable Key: sb_publishable_znpUTXAfpe88Z15BbNCLtw_xijTeWM8
Secret Key: sb_secret_WmhTrmpXHSC6wPpb4fopdw_3sSAJWfW
```

**⚠️ SECURITY WARNING:**
- Never commit `.env.local` to Git
- Never expose service role key or secrets in client-side code
- Use service role key only in secure server environments

## Setup Instructions

### 1. Run Migrations

Apply the multi-tenant schema migration:

```bash
# Using Supabase CLI (if installed)
supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run: supabase/migrations/20251207000000_multi_tenant_schema.sql
```

### 2. Configure Environment Variables

Ensure `.env.local` exists with all credentials (already created).

### 3. Initialize Super Admin

After your user account is created in Supabase Auth, run:

```typescript
import { initializeSuperAdmin } from '@/lib/db/tenant-helpers';
import { supabase } from '@/lib/supabase-client';

// Get current user
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  const result = await initializeSuperAdmin(supabase, user.id, 'Your Tenant Name');
  if (result.success) {
    console.log('Super admin initialized!');
  }
}
```

### 4. Verify Setup

Check that:
- ✅ Migration ran successfully
- ✅ Default roles exist (`viewer`, `member`, `editor`, `admin`, `super_admin`)
- ✅ Your user profile has `is_super_admin = true`
- ✅ Your user has a `tenant_id` assigned
- ✅ RLS policies are active on all tables

## Role Hierarchy

### Viewer (Level 10)
- Read-only access
- Can view tasks, projects, users
- Cannot create or modify anything

### Member (Level 20)
- Can create and edit own content
- Can assign tasks
- Cannot delete others' content

### Editor (Level 30)
- Can edit all content within tenant
- Can delete content
- Cannot manage users or settings

### Admin (Level 50)
- Full control within tenant
- Can manage users, roles, integrations
- Can update tenant settings
- Cannot access other tenants

### Super Admin (Level 100)
- **Full platform control**
- Can access all tenants
- Can manage all users
- Can create/manage tenants
- Can modify system roles and permissions
- **You are the only super admin**

## Permission System

### Checking Permissions

```typescript
import { hasPermission } from '@/lib/db/tenant-helpers';

const canCreateTasks = await hasPermission(supabase, 'tasks.create');
const isAdmin = await hasPermission(supabase, 'admin.all');
```

### Database Functions

- `public.current_tenant_id()` - Get current user's tenant ID
- `public.is_super_admin()` - Check if user is super admin
- `public.has_permission(permission_name)` - Check if user has permission
- `public.belongs_to_tenant(tenant_id)` - Check tenant membership

**Note:** Functions are in the `public` schema (not `auth` schema) to avoid permission issues.

## Adding Future Users

When you're ready to add friends/users:

1. **Create user in Supabase Auth** (via dashboard or API)
2. **Create profile** (automatically via trigger or manually)
3. **Assign to tenant**:
   ```typescript
   await inviteUserToTenant(supabase, tenantId, userId, roleId, yourUserId);
   ```
4. **Set role**:
   ```typescript
   await updateUserRole(supabase, tenantId, userId, roleId);
   ```

### Role Assignment Guidelines

- **Viewer**: Read-only access for stakeholders
- **Member**: Regular team members
- **Editor**: Team leads who manage content
- **Admin**: Tenant administrators
- **Super Admin**: Only you (platform-wide)

## Security Best Practices

1. **RLS is Always On**: All tables have RLS enabled
2. **Tenant Isolation**: Users can only access their tenant's data
3. **Super Admin Override**: Super admins can access all tenants (you)
4. **Permission Checks**: Always check permissions before actions
5. **Service Role Key**: Only use in secure server environments
6. **Never Expose Secrets**: Keep service role key and secrets server-side only

## Troubleshooting

### "Permission denied" errors
- Check RLS policies are active
- Verify user has correct `tenant_id`
- Check user's role has required permissions

### "Tenant not found" errors
- Ensure user profile has `tenant_id` set
- Run `initializeSuperAdmin` if you're the first user

### Migration errors
- Check Supabase logs in dashboard
- Verify all extensions are enabled (`uuid-ossp`, `pgcrypto`)
- Ensure you have proper database permissions

## Next Steps

1. ✅ Database schema created
2. ✅ Credentials configured
3. ✅ Migration ready to run
4. ⏳ Run migration in Supabase Dashboard
5. ⏳ Initialize super admin account
6. ⏳ Test multi-tenant isolation
7. ⏳ Add additional users when ready

## Support

For issues or questions:
- Check Supabase Dashboard logs
- Review RLS policies in SQL Editor
- Verify credentials in `.env.local`
- Test permissions using helper functions

---

**01:53:54 Dec 07, 2025**

