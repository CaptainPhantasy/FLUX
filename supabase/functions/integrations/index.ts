// =====================================
// FLUX - Integrations API
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
    const { supabase, user, profile } = context;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method;

    // GET /integrations
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'integrations') {
      const { data, error: dbError } = await supabase
        .from('integrations')
        .select('*')
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false });

      if (dbError) {
        // Return default integrations if table doesn't exist
        return success([
          { id: 'github', type: 'github', name: 'GitHub', isConnected: false },
          { id: 'slack', type: 'slack', name: 'Slack', isConnected: false },
          { id: 'figma', type: 'figma', name: 'Figma', isConnected: false },
        ]);
      }

      const integrations = (data || []).map((i) => ({
        id: i.id,
        type: i.type,
        name: i.name,
        isConnected: i.is_connected,
        config: i.config,
        lastSyncAt: i.last_sync_at,
      }));

      return success(integrations);
    }

    // POST /integrations/:type/connect
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'connect') {
      const integrationType = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('integrations')
        .upsert({
          tenant_id: profile.tenantId,
          user_id: user.id,
          type: integrationType,
          name: integrationType.charAt(0).toUpperCase() + integrationType.slice(1),
          is_connected: true,
          config: body.config || {},
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id,type',
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to connect integration', dbError);
      }

      return success({
        id: data.id,
        type: data.type,
        name: data.name,
        isConnected: data.is_connected,
        config: data.config,
        lastSyncAt: data.last_sync_at,
      }, undefined, 201);
    }

    // DELETE /integrations/:id/disconnect
    if (method === 'DELETE' && pathParts.length === 4 && pathParts[3] === 'disconnect') {
      const integrationId = pathParts[2];

      const { error: dbError } = await supabase
        .from('integrations')
        .update({ is_connected: false, config: null })
        .eq('id', integrationId)
        .eq('tenant_id', profile.tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to disconnect integration', dbError);
      }

      return success({ success: true });
    }

    // POST /integrations/:id/sync
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'sync') {
      const integrationId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integrationId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to sync integration', dbError);
      }

      // TODO: Trigger actual sync job here
      return success({ message: 'Sync triggered', integrationId });
    }

    // GET /integrations/:id/status
    if (method === 'GET' && pathParts.length === 4 && pathParts[3] === 'status') {
      const integrationId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('integrations')
        .select('is_connected, last_sync_at, config')
        .eq('id', integrationId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Integration not found', undefined, 404);
      }

      return success({
        isConnected: data.is_connected,
        lastSyncAt: data.last_sync_at,
        hasConfig: !!data.config,
      });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

