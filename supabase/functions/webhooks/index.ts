// =====================================
// FLUX - Webhooks API
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

    // POST /webhooks/zapier (inbound Zapier trigger)
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'zapier') {
      const body = await req.json();
      // TODO: Process Zapier webhook and trigger actions
      return success({ received: true, message: 'Zapier webhook received' });
    }

    // POST /webhooks/nanocoder (inbound Nanocoder command)
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'nanocoder') {
      const body = await req.json();
      // TODO: Process Nanocoder command and execute
      return success({ received: true, message: 'Nanocoder command received' });
    }

    // GET /webhooks/outbound
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'outbound') {
      const { data, error: dbError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('tenant_id', profile.tenantId)
        .eq('type', 'outbound');

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch webhooks', dbError);
      }

      return success(data || []);
    }

    // POST /webhooks/outbound
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'outbound') {
      const body = await req.json();
      if (!body.url || !body.events) {
        return error('VALIDATION_ERROR', 'url and events are required');
      }

      const { data, error: dbError } = await supabase
        .from('webhooks')
        .insert({
          tenant_id: profile.tenantId,
          user_id: user.id,
          type: 'outbound',
          url: body.url,
          events: body.events,
          secret: body.secret,
          is_active: body.isActive !== false,
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create webhook', dbError);
      }

      return success(data, undefined, 201);
    }

    // DELETE /webhooks/outbound/:id
    if (method === 'DELETE' && pathParts.length === 4 && pathParts[2] === 'outbound') {
      const webhookId = pathParts[3];

      const { error: dbError } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('tenant_id', profile.tenantId)
        .eq('user_id', user.id);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete webhook', dbError);
      }

      return success({ success: true });
    }

    // POST /webhooks/test/:id
    if (method === 'POST' && pathParts.length === 4 && pathParts[2] === 'test') {
      const webhookId = pathParts[3];

      const { data: webhook } = await supabase
        .from('webhooks')
        .select('url, secret')
        .eq('id', webhookId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!webhook) {
        return error('NOT_FOUND', 'Webhook not found', undefined, 404);
      }

      // TODO: Send test webhook
      return success({ message: 'Test webhook sent', webhookId });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

