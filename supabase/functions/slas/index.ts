// =====================================
// FLUX - SLAs API (ITSM)
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

    // GET /slas
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'slas') {
      const { data, error: dbError } = await supabase
        .from('slas')
        .select('*')
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false });

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch SLAs', dbError);
      }

      return success(data || []);
    }

    // POST /slas
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'slas') {
      const body = await req.json();
      if (!body.name || !body.targetResponseTime || !body.targetResolutionTime) {
        return error('VALIDATION_ERROR', 'Name, targetResponseTime, and targetResolutionTime are required');
      }

      const { data, error: dbError } = await supabase
        .from('slas')
        .insert({
          tenant_id: profile.tenantId,
          name: body.name,
          target_response_time: body.targetResponseTime,
          target_resolution_time: body.targetResolutionTime,
          priority: body.priority || 'medium',
          current_compliance: 100, // Initial
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create SLA', dbError);
      }

      return success(data, undefined, 201);
    }

    // PATCH /slas/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'slas') {
      const slaId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('slas')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slaId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update SLA', dbError);
      }

      return success(data);
    }

    // DELETE /slas/:id
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'slas') {
      const slaId = pathParts[2];

      const { error: dbError } = await supabase
        .from('slas')
        .delete()
        .eq('id', slaId)
        .eq('tenant_id', profile.tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete SLA', dbError);
      }

      return success({ success: true });
    }

    // GET /slas/compliance
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'compliance') {
      // TODO: Calculate compliance metrics
      return success({ data: [], message: 'Compliance calculation pending' });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

