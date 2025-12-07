// =====================================
// FLUX - Tenant Management Helpers
// Created: 01:53:54 Dec 07, 2025
// =====================================
// Helper functions for multi-tenant operations

// @ts-nocheck
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support both Vite (browser) and Node.js environments
const SUPABASE_URL = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.VITE_SUPABASE_URL || ''
  : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL || '' : '');
  
const SUPABASE_ANON_KEY = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY || '' : '');

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  isSystem: boolean;
  permissions: Record<string, unknown>;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  roleId?: string;
  status: 'active' | 'invited' | 'suspended' | 'removed';
  invitedBy?: string;
  invitedAt?: string;
  joinedAt?: string;
  removedAt?: string;
}

/**
 * Get current user's tenant ID
 */
export async function getCurrentTenantId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase.rpc('current_tenant_id');

  if (error) {
    console.error('Error getting tenant ID:', error);
    return null;
  }

  return data;
}

/**
 * Check if current user is super admin
 */
export async function isSuperAdmin(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_super_admin');

  if (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }

  return data || false;
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(
  supabase: SupabaseClient,
  permissionName: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_permission', {
    permission_name: permissionName,
  });

  if (error) {
    console.error('Error checking permission:', error);
    return false;
  }

  return data || false;
}

/**
 * Get all tenants (super admin only)
 */
export async function getAllTenants(
  supabase: SupabaseClient
): Promise<Tenant[]> {
  const { data, error } = await supabase.from('tenants').select('*');

  if (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }

  return data || [];
}

/**
 * Get current user's tenant
 */
export async function getCurrentTenant(
  supabase: SupabaseClient
): Promise<Tenant | null> {
  const tenantId = await getCurrentTenantId(supabase);
  if (!tenantId) return null;

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }

  return data;
}

/**
 * Get all roles
 */
export async function getAllRoles(supabase: SupabaseClient): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('level', { ascending: true });

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tenant members
 */
export async function getTenantMembers(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantMember[]> {
  const { data, error } = await supabase
    .from('tenant_members')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching tenant members:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new tenant (super admin only)
 */
export async function createTenant(
  supabase: SupabaseClient,
  tenantData: {
    name: string;
    slug: string;
    domain?: string;
    plan?: 'free' | 'pro' | 'enterprise';
  }
): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name: tenantData.name,
      slug: tenantData.slug,
      domain: tenantData.domain,
      plan: tenantData.plan || 'free',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating tenant:', error);
    return null;
  }

  return data;
}

/**
 * Update tenant (admin or super admin)
 */
export async function updateTenant(
  supabase: SupabaseClient,
  tenantId: string,
  updates: Partial<Tenant>
): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating tenant:', error);
    return null;
  }

  return data;
}

/**
 * Invite user to tenant
 */
export async function inviteUserToTenant(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  roleId: string,
  invitedBy: string
): Promise<TenantMember | null> {
  const { data, error } = await supabase
    .from('tenant_members')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      role_id: roleId,
      status: 'invited',
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error inviting user:', error);
    return null;
  }

  return data;
}

/**
 * Update user role in tenant
 */
export async function updateUserRole(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  roleId: string
): Promise<boolean> {
  // Update tenant_members
  const { error: memberError } = await supabase
    .from('tenant_members')
    .update({ role_id: roleId })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  if (memberError) {
    console.error('Error updating tenant member role:', memberError);
  }

  // Update profile role_id if user's current tenant matches
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role_id: roleId })
    .eq('id', userId)
    .eq('tenant_id', tenantId);

  if (profileError) {
    console.error('Error updating profile role:', profileError);
  }

  return !memberError && !profileError;
}

/**
 * Remove user from tenant
 */
export async function removeUserFromTenant(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('tenant_members')
    .update({
      status: 'removed',
      removed_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing user from tenant:', error);
    return false;
  }

  return true;
}

/**
 * Initialize super admin account
 * This should be run once to set up the first super admin
 */
export async function initializeSuperAdmin(
  supabase: SupabaseClient,
  userId: string,
  tenantName: string = 'Default Tenant'
): Promise<{ tenant: Tenant | null; success: boolean }> {
  try {
    // Get super admin role
    const { data: superAdminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'super_admin')
      .single();

    if (!superAdminRole) {
      console.error('Super admin role not found');
      return { tenant: null, success: false };
    }

    // Create default tenant
    const tenant = await createTenant(supabase, {
      name: tenantName,
      slug: 'default',
      plan: 'enterprise',
    });

    if (!tenant) {
      console.error('Failed to create tenant');
      return { tenant: null, success: false };
    }

    // Update user profile to super admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        tenant_id: tenant.id,
        role_id: superAdminRole.id,
        is_super_admin: true,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return { tenant, success: false };
    }

    // Add to tenant_members
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: userId,
        role_id: superAdminRole.id,
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Error adding to tenant members:', memberError);
      return { tenant, success: false };
    }

    return { tenant, success: true };
  } catch (error) {
    console.error('Error initializing super admin:', error);
    return { tenant: null, success: false };
  }
}

// 01:53:54 Dec 07, 2025

