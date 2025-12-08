// =====================================
// FLUX - Change Requests API (ITSM)
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

    // GET /changes
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'changes') {
      const { limit, offset } = parsePagination(url);
      const status = url.searchParams.get('status');
      const type = url.searchParams.get('type');

      let query = supabase
        .from('change_requests')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);
      if (type) query = query.eq('type', type);

      const { data, error: dbError, count } = await query;

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch change requests', dbError);
      }

      return success(data || [], {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // POST /changes
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'changes') {
      const body = await req.json();
      if (!body.title || !body.description) {
        return error('VALIDATION_ERROR', 'Title and description are required');
      }

      const { data, error: dbError } = await supabase
        .from('change_requests')
        .insert({
          tenant_id: profile.tenantId,
          title: body.title,
          description: body.description,
          status: body.status || 'draft',
          type: body.type || 'standard',
          risk: body.risk || 'medium',
          requestor_id: user.id,
          approvers: body.approvers || [],
          scheduled_date: body.scheduledDate,
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create change request', dbError);
      }

      return success(data, undefined, 201);
    }

    // PATCH /changes/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'changes') {
      const changeId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('change_requests')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', changeId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update change request', dbError);
      }

      return success(data);
    }

    // POST /changes/:id/submit
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'submit') {
      const changeId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('change_requests')
        .update({
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', changeId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to submit change request', dbError);
      }

      return success(data);
    }

    // POST /changes/:id/approve
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'approve') {
      const changeId = pathParts[2];

      // Verify user is an approver
      const { data: change } = await supabase
        .from('change_requests')
        .select('approvers, status')
        .eq('id', changeId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!change || !change.approvers?.includes(user.id)) {
        return error('FORBIDDEN', 'Not authorized to approve this change request', undefined, 403);
      }

      const { data, error: dbError } = await supabase
        .from('change_requests')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', changeId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to approve change request', dbError);
      }

      return success(data);
    }

    // POST /changes/:id/reject
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'reject') {
      const changeId = pathParts[2];

      // Verify user is an approver
      const { data: change } = await supabase
        .from('change_requests')
        .select('approvers')
        .eq('id', changeId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!change || !change.approvers?.includes(user.id)) {
        return error('FORBIDDEN', 'Not authorized to reject this change request', undefined, 403);
      }

      const { data, error: dbError } = await supabase
        .from('change_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', changeId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to reject change request', dbError);
      }

      return success(data);
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

