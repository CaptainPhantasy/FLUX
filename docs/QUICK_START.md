# FLUX Supabase Quick Start Guide

**Created:** 01:53:54 Dec 07, 2025  
**Last Updated:** 01:53:54 Dec 07, 2025

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Database Migrations

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to your project: `hhyirucmlpsibkckrhtc`
3. Navigate to **SQL Editor**
4. Run migrations in order:

   **Migration 1: Multi-Tenant Schema**
   ```sql
   -- Copy and paste contents of:
   -- supabase/migrations/20251207000000_multi_tenant_schema.sql
   ```

   **Migration 2: Migrate Existing Data** (if you have existing data)
   ```sql
   -- Copy and paste contents of:
   -- supabase/migrations/20251207000001_migrate_existing_data.sql
   ```

### Step 2: Verify Environment Variables

Check that `.env.local` exists and contains:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

### Step 3: Initialize Your Super Admin Account

**Option A: Using the Script (Recommended)**

```bash
# Make sure you're signed in to your app first, then:
npx tsx src/scripts/initialize-super-admin.ts
```

**Option B: Manual SQL**

Run this in Supabase SQL Editor (replace `YOUR_USER_ID` with your auth user ID):

```sql
-- Get your user ID first
select id, email from auth.users;

-- Then run (replace YOUR_USER_ID):
do $$
declare
  user_id uuid := 'YOUR_USER_ID';
  tenant_id uuid;
  super_admin_role_id uuid;
begin
  -- Get super admin role
  select id into super_admin_role_id from public.roles where name = 'super_admin' limit 1;

  -- Create default tenant
  insert into public.tenants (name, slug, plan, status)
  values ('Default Tenant', 'default', 'enterprise', 'active')
  returning id into tenant_id;

  -- Update profile
  update public.profiles
  set
    tenant_id = tenant_id,
    role_id = super_admin_role_id,
    is_super_admin = true
  where id = user_id;

  -- Add to tenant_members
  insert into public.tenant_members (tenant_id, user_id, role_id, status, joined_at)
  values (tenant_id, user_id, super_admin_role_id, 'active', now())
  on conflict (tenant_id, user_id) do nothing;
end $$;
```

### Step 4: Verify Setup

1. **Check your profile:**
   ```sql
   select id, email, tenant_id, is_super_admin, role_id
   from public.profiles
   where id = auth.uid();
   ```

2. **Check your tenant:**
   ```sql
   select * from public.tenants where id = (
     select tenant_id from public.profiles where id = auth.uid()
   );
   ```

3. **Test permissions:**
   ```sql
   select public.is_super_admin(); -- Should return true
   select public.current_tenant_id(); -- Should return your tenant ID
   ```

## ✅ Verification Checklist

- [ ] Migrations ran successfully (no errors)
- [ ] `.env.local` file exists with credentials
- [ ] Your user profile has `is_super_admin = true`
- [ ] Your user profile has `tenant_id` set
- [ ] `auth.is_super_admin()` returns `true`
- [ ] `auth.current_tenant_id()` returns your tenant ID
- [ ] RLS policies are active on all tables

## 🔐 Your Credentials Summary

All credentials are stored in `.env.local`:

- **Project URL:** `https://hhyirucmlpsibkckrhtc.supabase.co`
- **Anon Key:** (in `.env.local`)
- **Service Role Key:** (in `.env.local` - server-side only)
- **Database Password:** `GGLjFikgs9b2wI1S` (server-side only)

## 🎯 Next Steps

1. **Test the application** - Sign in and verify everything works
2. **Review permissions** - Check that you have full access
3. **Add users later** - When ready, use the tenant helpers to invite users

## 🆘 Troubleshooting

### "Permission denied" errors
- Ensure migrations ran successfully
- Check that your profile has `is_super_admin = true`
- Verify RLS policies are active

### "Tenant not found" errors
- Run the super admin initialization script
- Check that your profile has `tenant_id` set

### Migration errors
- Check Supabase logs in dashboard
- Verify all extensions are enabled
- Ensure you have database admin permissions

## 📚 Additional Resources

- Full setup guide: `docs/SUPABASE_SETUP.md`
- Tenant helpers: `src/lib/db/tenant-helpers.ts`
- Migration files: `supabase/migrations/`

---

**01:53:54 Dec 07, 2025**

