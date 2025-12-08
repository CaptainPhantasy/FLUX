// =====================================
// FLUX - Tenants API
// =====================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateAuth } from '../_shared/auth.ts';
import { success, error, cors } from '../_shared/responses.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return cors();

  try {
    const authResult = await validateAuth(req);
    if (!authResult.success || !authResult.context) {
      return error(
        authResult.error!.code,
        authResult.error!.message,
        undefined,
        authResult.error!.code === 'UNAUTHORIZED' ? 401 : 403
      );
    }

    const { context } = authResult;
    const { supabase, profile } = context;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // GET /tenants/current
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'current') {
      const { data, error: dbError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenantId)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Tenant not found', undefined, 404);
      }

      return success({
        id: data.id,
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        plan: data.plan,
        status: data.status,
        settings: data.settings || {},
        metadata: data.metadata || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }

    // PATCH /tenants/current (admin only)
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[2] === 'current') {
      const hasTenantPerm = await supabase.rpc('has_permission', {
        p_user_id: context.user.id,
        p_permission: 'tenant.update',
      });

      if (!hasTenantPerm.data && !profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Admin access required', undefined, 403);
      }

      const body = await req.json();
      const updateData: Record<string, unknown> = {};
      
      if (body.name !== undefined) updateData.name = body.name;
      if (body.settings !== undefined) updateData.settings = body.settings;
      if (body.metadata !== undefined) updateData.metadata = body.metadata;

      const { data, error: dbError } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update tenant', dbError);
      }

      return success({
        id: data.id,
        name: data.name,
        slug: data.slug,
        settings: data.settings,
        metadata: data.metadata,
      });
    }

    // GET /tenants (super admin only)
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'tenants') {
      if (!profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Super admin access required', undefined, 403);
      }

      const { data, error: dbError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch tenants', dbError);
      }

      const tenants = (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        domain: t.domain,
        plan: t.plan,
        status: t.status,
        createdAt: t.created_at,
      }));

      return success(tenants);
    }

    // POST /tenants (super admin only)
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'tenants') {
      if (!profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Super admin access required', undefined, 403);
      }

      const body = await req.json();
      if (!body.name || !body.slug) {
        return error('VALIDATION_ERROR', 'Name and slug are required');
      }

      const { data, error: dbError } = await supabase
        .from('tenants')
        .insert({
          name: body.name,
          slug: body.slug,
          domain: body.domain,
          plan: body.plan || 'free',
          status: body.status || 'active',
          settings: body.settings || {},
          metadata: body.metadata || {},
          created_by: context.user.id,
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create tenant', dbError);
      }

      return success({
        id: data.id,
        name: data.name,
        slug: data.slug,
        plan: data.plan,
        status: data.status,
      }, undefined, 201);
    }

    // DELETE /tenants/:id (super admin only)
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'tenants') {
      if (!profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Super admin access required', undefined, 403);
      }

      const tenantId = pathParts[2];
      if (tenantId === profile.tenantId) {
        return error('VALIDATION_ERROR', 'Cannot delete your own tenant');
      }

      const { error: dbError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete tenant', dbError);
      }

      return success({ success: true });
    }

    // GET /tenants/:id/members
    if (method === 'GET' && pathParts.length === 4 && pathParts[3] === 'members') {
      const tenantId = pathParts[2];
      
      // Check access (must be member of tenant or super admin)
      if (tenantId !== profile.tenantId && !profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Access denied', undefined, 403);
      }

      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('id, email, name, avatar, role_id, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch members', dbError);
      }

      return success(data || []);
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

