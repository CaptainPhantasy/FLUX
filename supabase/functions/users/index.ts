// =====================================
// FLUX - Users API
// =====================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateAuth, hasPermission } from '../_shared/auth.ts';
import { success, error, cors } from '../_shared/responses.ts';
import { parsePagination, createPaginationMeta } from '../_shared/types.ts';

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
    const { supabase, user, profile } = context;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // GET /users/me
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'me') {
      const { data: profileData, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError || !profileData) {
        return error('NOT_FOUND', 'User profile not found', undefined, 404);
      }

      const { data: roleData } = await supabase
        .from('roles')
        .select('name, display_name')
        .eq('id', profileData.role_id)
        .single();

      return success({
        id: profileData.id,
        email: profileData.email || user.email,
        name: profileData.name || 'Flux User',
        avatar: profileData.avatar,
        role: roleData?.name || 'member',
        tenantId: profileData.tenant_id,
        roleId: profileData.role_id,
        isSuperAdmin: profileData.is_super_admin || false,
        preferences: profileData.preferences || {},
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      });
    }

    // PATCH /users/me
    if (method === 'PATCH' && pathParts.length === 2 && pathParts[1] === 'me') {
      const body = await req.json();
      const updateData: Record<string, unknown> = {};
      
      if (body.name !== undefined) updateData.name = body.name;
      if (body.avatar !== undefined) updateData.avatar = body.avatar;

      const { data, error: dbError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update profile', dbError);
      }

      return success({
        id: data.id,
        email: data.email || user.email,
        name: data.name,
        avatar: data.avatar,
        preferences: data.preferences || {},
      });
    }

    // PATCH /users/me/preferences
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[2] === 'preferences') {
      const body = await req.json();

      const { data: current } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const updatedPreferences = { ...(current?.preferences || {}), ...body };

      const { data, error: dbError } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update preferences', dbError);
      }

      return success({ preferences: data.preferences });
    }

    // GET /users (admin only)
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'users') {
      const hasAdminPerm = await hasPermission(supabase, user.id, 'users.read');
      if (!hasAdminPerm && !profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Admin access required', undefined, 403);
      }

      const { limit, offset } = parsePagination(url);
      const { data, error: dbError, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenantId)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch users', dbError);
      }

      const users = (data || []).map((p) => ({
        id: p.id,
        email: p.email,
        name: p.name,
        avatar: p.avatar,
        roleId: p.role_id,
        tenantId: p.tenant_id,
        isSuperAdmin: p.is_super_admin || false,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      return success(users, {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // POST /users/invite (admin only)
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'invite') {
      const hasInvitePerm = await hasPermission(supabase, user.id, 'users.invite');
      if (!hasInvitePerm && !profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Admin access required', undefined, 403);
      }

      const body = await req.json();
      if (!body.email) {
        return error('VALIDATION_ERROR', 'Email is required');
      }

      // TODO: Implement actual invitation logic (send email, create pending user, etc.)
      return success({ message: 'Invitation sent', email: body.email });
    }

    // PATCH /users/:id/role (admin only)
    if (method === 'PATCH' && pathParts.length === 4 && pathParts[3] === 'role') {
      const hasManagePerm = await hasPermission(supabase, user.id, 'users.update');
      if (!hasManagePerm && !profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Admin access required', undefined, 403);
      }

      const userId = pathParts[2];
      const body = await req.json();

      if (!body.roleId) {
        return error('VALIDATION_ERROR', 'roleId is required');
      }

      const { data, error: dbError } = await supabase
        .from('profiles')
        .update({ role_id: body.roleId })
        .eq('id', userId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update user role', dbError);
      }

      return success({ id: data.id, roleId: data.role_id });
    }

    // DELETE /users/:id (admin only)
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'users') {
      const hasRemovePerm = await hasPermission(supabase, user.id, 'users.remove');
      if (!hasRemovePerm && !profile.isSuperAdmin) {
        return error('FORBIDDEN', 'Admin access required', undefined, 403);
      }

      const userId = pathParts[2];
      if (userId === user.id) {
        return error('VALIDATION_ERROR', 'Cannot delete your own account');
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .eq('tenant_id', profile.tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete user', dbError);
      }

      return success({ success: true });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

