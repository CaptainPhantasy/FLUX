// =====================================
// FLUX - Projects API
// =====================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateAuth } from '../_shared/auth.ts';
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

    const transformProject = (db: any) => ({
      id: db.id,
      name: db.name,
      description: db.description,
      color: db.color || '#8B5CF6',
      icon: db.icon,
      ownerId: db.owner_id,
      members: db.members || [],
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    });

    // GET /projects
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'projects') {
      const { limit, offset } = parsePagination(url);

      const { data, error: dbError, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch projects', dbError);
      }

      const projects = (data || []).map(transformProject);

      return success(projects, {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // GET /projects/:id
    if (method === 'GET' && pathParts.length === 3 && pathParts[1] === 'projects') {
      const projectId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Project not found', undefined, 404);
      }

      return success(transformProject(data));
    }

    // POST /projects
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'projects') {
      const body = await req.json();
      if (!body.name) {
        return error('VALIDATION_ERROR', 'Name is required');
      }

      const { data, error: dbError } = await supabase
        .from('projects')
        .insert({
          tenant_id: profile.tenantId,
          name: body.name,
          description: body.description,
          color: body.color || '#8B5CF6',
          icon: body.icon,
          owner_id: user.id,
          members: body.members || [user.id],
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create project', dbError);
      }

      return success(transformProject(data), undefined, 201);
    }

    // PATCH /projects/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'projects') {
      const projectId = pathParts[2];
      const body = await req.json();

      // Verify ownership
      const { data: existing } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!existing || (existing.owner_id !== user.id && !profile.isSuperAdmin)) {
        return error('FORBIDDEN', 'Only project owner can update', undefined, 403);
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.color !== undefined) updateData.color = body.color;
      if (body.icon !== undefined) updateData.icon = body.icon;

      const { data, error: dbError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update project', dbError);
      }

      return success(transformProject(data));
    }

    // DELETE /projects/:id
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'projects') {
      const projectId = pathParts[2];

      // Verify ownership
      const { data: existing } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!existing || (existing.owner_id !== user.id && !profile.isSuperAdmin)) {
        return error('FORBIDDEN', 'Only project owner can delete', undefined, 403);
      }

      const { error: dbError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete project', dbError);
      }

      return success({ success: true });
    }

    // POST /projects/:id/members
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'members') {
      const projectId = pathParts[2];
      const body = await req.json();

      if (!body.userId) {
        return error('VALIDATION_ERROR', 'userId is required');
      }

      // Verify ownership
      const { data: existing } = await supabase
        .from('projects')
        .select('members, owner_id')
        .eq('id', projectId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!existing || (existing.owner_id !== user.id && !profile.isSuperAdmin)) {
        return error('FORBIDDEN', 'Only project owner can add members', undefined, 403);
      }

      const members = [...(existing.members || []), body.userId];
      const { data, error: dbError } = await supabase
        .from('projects')
        .update({ members, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to add member', dbError);
      }

      return success(transformProject(data));
    }

    // DELETE /projects/:id/members/:userId
    if (method === 'DELETE' && pathParts.length === 5 && pathParts[3] === 'members') {
      const projectId = pathParts[2];
      const userId = pathParts[4];

      // Verify ownership
      const { data: existing } = await supabase
        .from('projects')
        .select('members, owner_id')
        .eq('id', projectId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!existing || (existing.owner_id !== user.id && !profile.isSuperAdmin)) {
        return error('FORBIDDEN', 'Only project owner can remove members', undefined, 403);
      }

      const members = (existing.members || []).filter((id: string) => id !== userId);
      const { data, error: dbError } = await supabase
        .from('projects')
        .update({ members, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to remove member', dbError);
      }

      return success(transformProject(data));
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

