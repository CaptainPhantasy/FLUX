// =====================================
// FLUX - Initialize Super Admin Script
// Created: 01:53:54 Dec 07, 2025
// =====================================
// Run this script once after setting up Supabase to initialize your super admin account
// Usage: npx tsx src/scripts/initialize-super-admin.ts

// @ts-nocheck
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { initializeSuperAdmin } from '../lib/db/tenant-helpers';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Supabase credentials not found');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

async function main() {
  console.log('🚀 Initializing Super Admin...\n');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: Supabase credentials not found');
    console.error('Please ensure .env.local exists with:');
    console.error('  VITE_SUPABASE_URL=...');
    console.error('  VITE_SUPABASE_ANON_KEY=...');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Use provided user ID or try to get current user
  const userId = process.argv[2] || null;

  if (userId) {
    console.log(`📋 Using provided User ID: ${userId}\n`);
    
    // Use service role key for admin operations if available
    const adminClient = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
      : supabase;
    
    // Verify user exists by checking profiles table
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('❌ Error: User profile not found');
      console.error('The user may not have a profile yet. Creating one...\n');
      
      // Try to create profile first
      const { error: createError } = await adminClient
        .from('profiles')
        .insert({
          id: userId,
          email: 'douglastalley1977@gmail.com', // From your auth data
          name: 'DOUGLAS A TALLEY',
          role: 'superadmin',
        });
      
      if (createError) {
        console.error('❌ Failed to create profile:', createError.message);
        console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
        console.log(`
-- Initialize Super Admin
do $$
declare
  user_id uuid := '${userId}';
  tenant_id uuid;
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
  on conflict (slug) do nothing
  returning id into tenant_id;

  if tenant_id is null then
    select id into tenant_id from public.tenants where slug = 'default' limit 1;
  end if;

  -- Ensure profile exists
  insert into public.profiles (id, email, name, role)
  values (user_id, 'douglastalley1977@gmail.com', 'DOUGLAS A TALLEY', 'superadmin')
  on conflict (id) do update
  set role = 'superadmin';

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
  on conflict (tenant_id, user_id) do update
  set role_id = super_admin_role_id, status = 'active';

  raise notice 'Super admin initialized!';
end $$;
        `);
        process.exit(1);
      }
    }

    console.log(`✅ Found user: ${profile?.email || 'douglastalley1977@gmail.com'}`);
    console.log(`   User ID: ${userId}\n`);
    
    // Initialize super admin directly using SQL
    console.log('📦 Creating default tenant and assigning super admin role...\n');
    
    const { data: superAdminRole } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'super_admin')
      .single();

    if (!superAdminRole) {
      console.error('❌ Error: Super admin role not found');
      console.error('Please ensure migrations have been run');
      process.exit(1);
    }

    // Create or get default tenant
    const { data: tenant, error: tenantError } = await adminClient
      .from('tenants')
      .upsert({
        name: 'Default Tenant',
        slug: 'default',
        plan: 'enterprise',
        status: 'active',
      }, {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      // Try to get existing tenant
      const { data: existingTenant } = await adminClient
        .from('tenants')
        .select('*')
        .eq('slug', 'default')
        .single();

      if (!existingTenant) {
        console.error('❌ Failed to create/get tenant:', tenantError?.message);
        process.exit(1);
      }

      // Update profile
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          tenant_id: existingTenant.id,
          role_id: superAdminRole.id,
          is_super_admin: true,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to update profile:', updateError.message);
        process.exit(1);
      }

      // Add to tenant_members
      await adminClient
        .from('tenant_members')
        .upsert({
          tenant_id: existingTenant.id,
          user_id: userId,
          role_id: superAdminRole.id,
          status: 'active',
          joined_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id,user_id'
        });

      console.log('✅ Super admin initialized successfully!\n');
      console.log('📋 Details:');
      console.log(`   Tenant ID: ${existingTenant.id}`);
      console.log(`   Tenant Name: ${existingTenant.name}`);
      console.log(`   Tenant Slug: ${existingTenant.slug}`);
      console.log(`   Plan: ${existingTenant.plan}\n`);
      console.log('🎉 You now have full platform access!');
      return;
    }

    // Update profile
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        tenant_id: tenant.id,
        role_id: superAdminRole.id,
        is_super_admin: true,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Failed to update profile:', updateError.message);
      process.exit(1);
    }

    // Add to tenant_members
    await adminClient
      .from('tenant_members')
      .upsert({
        tenant_id: tenant.id,
        user_id: userId,
        role_id: superAdminRole.id,
        status: 'active',
        joined_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,user_id'
      });

    console.log('✅ Super admin initialized successfully!\n');
    console.log('📋 Details:');
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Tenant Name: ${tenant.name}`);
    console.log(`   Tenant Slug: ${tenant.slug}`);
    console.log(`   Plan: ${tenant.plan}\n`);
    console.log('🎉 You now have full platform access!');
    return;
  }

  // Try to get current user (requires session)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Error: Not authenticated');
    console.error('\nPlease provide your user ID as an argument:');
    console.log(`  npm run init:super-admin YOUR_USER_ID`);
    console.log('\nOr sign in to your app first, then run:');
    console.log('  npm run init:super-admin');
    console.log('\nYour User ID: 663a4850-0a04-4b71-a863-9098a80f7408');
    process.exit(1);
  }

  console.log(`✅ Authenticated as: ${user.email}`);
  console.log(`   User ID: ${user.id}\n`);

  // Check if already initialized
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin, tenant_id, role_id')
    .eq('id', user.id)
    .single();

  if (profile?.is_super_admin && profile?.tenant_id) {
    console.log('✅ Super admin already initialized!');
    console.log(`   Tenant ID: ${profile.tenant_id}`);
    console.log(`   Role ID: ${profile.role_id}`);
    return;
  }

  // Initialize super admin
  console.log('📦 Creating default tenant and assigning super admin role...\n');

  const result = await initializeSuperAdmin(
    supabase,
    user.id,
    'Default Tenant'
  );

  if (result.success && result.tenant) {
    console.log('✅ Super admin initialized successfully!\n');
    console.log('📋 Details:');
    console.log(`   Tenant ID: ${result.tenant.id}`);
    console.log(`   Tenant Name: ${result.tenant.name}`);
    console.log(`   Tenant Slug: ${result.tenant.slug}`);
    console.log(`   Plan: ${result.tenant.plan}\n`);
    console.log('🎉 You now have full platform access!');
  } else {
    console.error('❌ Failed to initialize super admin');
    console.error('Please check:');
    console.error('  1. Migration has been run');
    console.error('  2. Roles table has super_admin role');
    console.error('  3. You have proper database permissions');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

// 01:53:54 Dec 07, 2025

