// =====================================
// FLUX - Email Labels API
// =====================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateAuth } from '../_shared/auth.ts';
import { success, error, cors } from '../_shared/responses.ts';
import type { EmailLabel } from '../_shared/email-types.ts';

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

    const transformLabel = (db: any): EmailLabel => ({
      id: db.id,
      tenantId: db.tenant_id,
      userId: db.user_id,
      name: db.name,
      color: db.color,
      createdAt: db.created_at,
    });

    // GET /email-labels
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'email-labels') {
      const { data, error: dbError } = await supabase
        .from('email_labels')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false });

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch email labels', dbError);
      }

      const labels = (data || []).map(transformLabel);

      return success(labels);
    }

    // POST /email-labels
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'email-labels') {
      const body = await req.json();
      if (!body.name) {
        return error('VALIDATION_ERROR', 'Name is required');
      }

      const { data, error: dbError } = await supabase
        .from('email_labels')
        .insert({
          tenant_id: profile.tenantId,
          user_id: user.id,
          name: body.name,
          color: body.color || '#6366f1',
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create email label', dbError);
      }

      return success(transformLabel(data), undefined, 201);
    }

    // PATCH /email-labels/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'email-labels') {
      const labelId = pathParts[2];
      const body = await req.json();

      // Verify ownership
      const { data: existing } = await supabase
        .from('email_labels')
        .select('id')
        .eq('id', labelId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Email label not found', undefined, 404);
      }

      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.color !== undefined) updateData.color = body.color;

      const { data, error: dbError } = await supabase
        .from('email_labels')
        .update(updateData)
        .eq('id', labelId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update email label', dbError);
      }

      return success(transformLabel(data));
    }

    // DELETE /email-labels/:id
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'email-labels') {
      const labelId = pathParts[2];

      // Verify ownership
      const { data: existing } = await supabase
        .from('email_labels')
        .select('id')
        .eq('id', labelId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Email label not found', undefined, 404);
      }

      const { error: dbError } = await supabase
        .from('email_labels')
        .delete()
        .eq('id', labelId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete email label', dbError);
      }

      return success({ success: true });
    }

    // POST /emails/:id/labels/:labelId (add label to email)
    if (method === 'POST' && pathParts.length === 5 && pathParts[3] === 'labels') {
      const emailId = pathParts[2];
      const labelId = pathParts[4];

      // Get label
      const { data: label } = await supabase
        .from('email_labels')
        .select('name')
        .eq('id', labelId)
        .eq('user_id', user.id)
        .single();

      if (!label) {
        return error('NOT_FOUND', 'Email label not found', undefined, 404);
      }

      // Get email
      const { data: email } = await supabase
        .from('emails')
        .select('labels, email_accounts!inner(user_id)')
        .eq('id', emailId)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (!email) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      const labels = [...(email.labels || []), label.name];
      const { error: dbError } = await supabase
        .from('emails')
        .update({ labels, updated_at: new Date().toISOString() })
        .eq('id', emailId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to add label to email', dbError);
      }

      return success({ success: true });
    }

    // DELETE /emails/:id/labels/:labelId (remove label from email)
    if (method === 'DELETE' && pathParts.length === 5 && pathParts[3] === 'labels') {
      const emailId = pathParts[2];
      const labelId = pathParts[4];

      // Get label
      const { data: label } = await supabase
        .from('email_labels')
        .select('name')
        .eq('id', labelId)
        .eq('user_id', user.id)
        .single();

      if (!label) {
        return error('NOT_FOUND', 'Email label not found', undefined, 404);
      }

      // Get email
      const { data: email } = await supabase
        .from('emails')
        .select('labels, email_accounts!inner(user_id)')
        .eq('id', emailId)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (!email) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      const labels = (email.labels || []).filter((l: string) => l !== label.name);
      const { error: dbError } = await supabase
        .from('emails')
        .update({ labels, updated_at: new Date().toISOString() })
        .eq('id', emailId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to remove label from email', dbError);
      }

      return success({ success: true });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

