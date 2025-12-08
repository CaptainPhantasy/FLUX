// =====================================
// FLUX - Sprints API
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
    const { supabase, profile } = context;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // GET /sprints
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'sprints') {
      const { limit, offset } = parsePagination(url);
      const projectId = url.searchParams.get('projectId');
      const status = url.searchParams.get('status');

      let query = supabase
        .from('sprints')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (projectId) query = query.eq('project_id', projectId);
      if (status) query = query.eq('status', status);

      const { data, error: dbError, count } = await query;

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch sprints', dbError);
      }

      return success(data || [], {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // POST /sprints
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'sprints') {
      const body = await req.json();
      if (!body.name || !body.startDate || !body.endDate) {
        return error('VALIDATION_ERROR', 'Name, startDate, and endDate are required');
      }

      const { data, error: dbError } = await supabase
        .from('sprints')
        .insert({
          tenant_id: profile.tenantId,
          project_id: body.projectId,
          name: body.name,
          goal: body.goal,
          start_date: body.startDate,
          end_date: body.endDate,
          status: body.status || 'planning',
          capacity: body.capacity || 0,
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create sprint', dbError);
      }

      return success(data, undefined, 201);
    }

    // PATCH /sprints/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'sprints') {
      const sprintId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('sprints')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sprintId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update sprint', dbError);
      }

      return success(data);
    }

    // POST /sprints/:id/start
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'start') {
      const sprintId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('sprints')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', sprintId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to start sprint', dbError);
      }

      return success(data);
    }

    // POST /sprints/:id/complete
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'complete') {
      const sprintId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('sprints')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', sprintId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to complete sprint', dbError);
      }

      return success(data);
    }

    // GET /sprints/:id/burndown
    if (method === 'GET' && pathParts.length === 4 && pathParts[3] === 'burndown') {
      const sprintId = pathParts[2];
      // TODO: Calculate burndown data from sprint tasks
      return success({ data: [], message: 'Burndown calculation pending' });
    }

    // GET /sprints/velocity
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'velocity') {
      // TODO: Calculate velocity metrics
      return success({ data: [], message: 'Velocity calculation pending' });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

