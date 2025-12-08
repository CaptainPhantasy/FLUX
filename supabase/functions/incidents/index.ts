// =====================================
// FLUX - Incidents API (ITSM)
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

    // GET /incidents
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'incidents') {
      const { limit, offset } = parsePagination(url);
      const severity = url.searchParams.get('severity');
      const status = url.searchParams.get('status');
      const assigneeId = url.searchParams.get('assigneeId');

      let query = supabase
        .from('incidents')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (severity) query = query.eq('severity', severity);
      if (status) query = query.eq('status', status);
      if (assigneeId) query = query.eq('assignee_id', assigneeId);

      const { data, error: dbError, count } = await query;

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch incidents', dbError);
      }

      return success(data || [], {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // POST /incidents
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'incidents') {
      const body = await req.json();
      if (!body.title || !body.description) {
        return error('VALIDATION_ERROR', 'Title and description are required');
      }

      const { data, error: dbError } = await supabase
        .from('incidents')
        .insert({
          tenant_id: profile.tenantId,
          title: body.title,
          description: body.description,
          severity: body.severity || 'medium',
          status: body.status || 'open',
          assignee_id: body.assigneeId,
          sla_deadline: body.slaDeadline,
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create incident', dbError);
      }

      return success(data, undefined, 201);
    }

    // PATCH /incidents/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'incidents') {
      const incidentId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('incidents')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update incident', dbError);
      }

      return success(data);
    }

    // POST /incidents/:id/resolve
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'resolve') {
      const incidentId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('incidents')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to resolve incident', dbError);
      }

      return success(data);
    }

    // POST /incidents/:id/escalate
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'escalate') {
      const incidentId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('incidents')
        .update({
          status: 'escalated',
          assignee_id: body.assigneeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to escalate incident', dbError);
      }

      return success(data);
    }

    // GET /incidents/sla-at-risk
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'sla-at-risk') {
      // TODO: Calculate incidents at SLA risk
      return success({ data: [], message: 'SLA risk calculation pending' });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

