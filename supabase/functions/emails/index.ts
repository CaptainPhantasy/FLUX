// =====================================
// FLUX - Emails API
// =====================================
// CRITICAL: Local delete only - does NOT affect actual email account

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateAuth } from '../_shared/auth.ts';
import { success, error, cors } from '../_shared/responses.ts';
import { parsePagination, createPaginationMeta } from '../_shared/types.ts';
import type { Email, EmailCreateInput, EmailUpdateInput, EmailFolder } from '../_shared/email-types.ts';

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

    const transformEmail = (db: any): Email => ({
      id: db.id,
      tenantId: db.tenant_id,
      accountId: db.account_id,
      messageId: db.message_id,
      inReplyTo: db.in_reply_to,
      threadId: db.thread_id,
      fromAddress: db.from_address,
      fromName: db.from_name,
      toAddresses: db.to_addresses || [],
      ccAddresses: db.cc_addresses || [],
      bccAddresses: db.bcc_addresses || [],
      subject: db.subject,
      bodyText: db.body_text,
      bodyHtml: db.body_html,
      receivedAt: db.received_at,
      sentAt: db.sent_at,
      sizeBytes: db.size_bytes,
      isRead: db.is_read,
      isStarred: db.is_starred,
      isArchived: db.is_archived,
      isDeleted: db.is_deleted,
      labels: db.labels || [],
      folder: db.folder,
      attachments: db.attachments || [],
      headers: db.headers,
      metadata: db.metadata,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    });

    // GET /emails
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'emails') {
      const { limit, offset } = parsePagination(url);
      const accountId = url.searchParams.get('accountId');
      const folder = url.searchParams.get('folder') as EmailFolder | null;
      const isRead = url.searchParams.get('isRead');
      const isStarred = url.searchParams.get('isStarred');

      // Build query - only emails from user's accounts
      let query = supabase
        .from('emails')
        .select(`
          *,
          email_accounts!inner(user_id)
        `, { count: 'exact' })
        .eq('email_accounts.user_id', user.id)
        .eq('is_deleted', false)
        .order('received_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (accountId) query = query.eq('account_id', accountId);
      if (folder) query = query.eq('folder', folder);
      if (isRead === 'true') query = query.eq('is_read', true);
      if (isRead === 'false') query = query.eq('is_read', false);
      if (isStarred === 'true') query = query.eq('is_starred', true);

      const { data, error: dbError, count } = await query;

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch emails', dbError);
      }

      const emails = (data || []).map(transformEmail);

      return success(emails, {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // GET /emails/search
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'search') {
      const queryParam = url.searchParams.get('q');
      const folder = url.searchParams.get('folder') as EmailFolder | null;
      const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '50', 10));

      if (!queryParam) {
        return error('VALIDATION_ERROR', 'Query parameter q is required');
      }

      // Use database search function
      const { data, error: dbError } = await supabase.rpc('search_emails', {
        p_user_id: user.id,
        p_query: queryParam,
        p_folder: folder || null,
        p_limit: limit,
      });

      if (dbError) {
        return error('DATABASE_ERROR', 'Search failed', dbError);
      }

      const emails = (data || []).map(transformEmail);

      return success(emails);
    }

    // GET /emails/:id
    if (method === 'GET' && pathParts.length === 3 && pathParts[1] === 'emails') {
      const emailId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('emails')
        .select(`
          *,
          email_accounts!inner(user_id)
        `)
        .eq('id', emailId)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      return success(transformEmail(data));
    }

    // POST /emails (for system/AI use)
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'emails') {
      const body: EmailCreateInput = await req.json();
      if (!body.accountId || !body.fromAddress || !body.subject) {
        return error('VALIDATION_ERROR', 'accountId, fromAddress, and subject are required');
      }

      // Verify account ownership
      const { data: account } = await supabase
        .from('email_accounts')
        .select('tenant_id')
        .eq('id', body.accountId)
        .eq('user_id', user.id)
        .single();

      if (!account) {
        return error('NOT_FOUND', 'Email account not found', undefined, 404);
      }

      const { data, error: dbError } = await supabase
        .from('emails')
        .insert({
          tenant_id: account.tenant_id,
          account_id: body.accountId,
          message_id: body.messageId,
          in_reply_to: body.inReplyTo,
          thread_id: body.threadId,
          from_address: body.fromAddress,
          from_name: body.fromName,
          to_addresses: body.toAddresses,
          cc_addresses: body.ccAddresses || [],
          bcc_addresses: body.bccAddresses || [],
          subject: body.subject,
          body_text: body.bodyText,
          body_html: body.bodyHtml,
          received_at: body.receivedAt,
          sent_at: body.sentAt,
          size_bytes: body.sizeBytes,
          folder: body.folder || 'inbox',
          attachments: body.attachments || [],
          headers: body.headers || {},
          metadata: body.metadata || {},
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create email', dbError);
      }

      return success(transformEmail(data), undefined, 201);
    }

    // PATCH /emails/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'emails') {
      const emailId = pathParts[2];
      const body: EmailUpdateInput = await req.json();

      // Verify ownership
      const { data: existing } = await supabase
        .from('emails')
        .select(`
          id,
          email_accounts!inner(user_id)
        `)
        .eq('id', emailId)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.isRead !== undefined) updateData.is_read = body.isRead;
      if (body.isStarred !== undefined) updateData.is_starred = body.isStarred;
      if (body.isArchived !== undefined) updateData.is_archived = body.isArchived;
      if (body.isDeleted !== undefined) updateData.is_deleted = body.isDeleted;
      if (body.labels !== undefined) updateData.labels = body.labels;
      if (body.folder !== undefined) updateData.folder = body.folder;

      const { data, error: dbError } = await supabase
        .from('emails')
        .update(updateData)
        .eq('id', emailId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update email', dbError);
      }

      return success(transformEmail(data));
    }

    // DELETE /emails/:id (LOCAL DELETE ONLY - does NOT affect actual email)
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'emails') {
      const emailId = pathParts[2];

      // Verify ownership
      const { data: existing } = await supabase
        .from('emails')
        .select(`
          id,
          email_accounts!inner(user_id)
        `)
        .eq('id', emailId)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      // Soft delete (local only - does NOT delete from actual email account)
      const { error: dbError } = await supabase
        .from('emails')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', emailId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete email', dbError);
      }

      return success({ success: true, message: 'Email deleted locally (does not affect actual email account)' });
    }

    // POST /emails/:id/mark-read
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'mark-read') {
      const emailId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('emails')
        .update({ is_read: body.isRead !== false, updated_at: new Date().toISOString() })
        .eq('id', emailId)
        .select(`
          *,
          email_accounts!inner(user_id)
        `)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      return success(transformEmail(data));
    }

    // POST /emails/:id/star
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'star') {
      const emailId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('emails')
        .update({ is_starred: body.isStarred !== false, updated_at: new Date().toISOString() })
        .eq('id', emailId)
        .select(`
          *,
          email_accounts!inner(user_id)
        `)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      return success(transformEmail(data));
    }

    // POST /emails/:id/archive
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'archive') {
      const emailId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('emails')
        .update({ is_archived: body.isArchived !== false, updated_at: new Date().toISOString() })
        .eq('id', emailId)
        .select(`
          *,
          email_accounts!inner(user_id)
        `)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      return success(transformEmail(data));
    }

    // POST /emails/:id/move
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'move') {
      const emailId = pathParts[2];
      const body = await req.json();

      if (!body.folder) {
        return error('VALIDATION_ERROR', 'folder is required');
      }

      const { data, error: dbError } = await supabase
        .from('emails')
        .update({ folder: body.folder, updated_at: new Date().toISOString() })
        .eq('id', emailId)
        .select(`
          *,
          email_accounts!inner(user_id)
        `)
        .eq('email_accounts.user_id', user.id)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Email not found', undefined, 404);
      }

      return success(transformEmail(data));
    }

    // GET /emails/unread-count
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'unread-count') {
      const { data, error: dbError } = await supabase.rpc('get_unread_email_count', {
        p_user_id: user.id,
      });

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to get unread count', dbError);
      }

      return success({ count: data || 0 });
    }

    // POST /emails/bulk-update
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'bulk-update') {
      const body = await req.json();
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return error('VALIDATION_ERROR', 'ids array is required');
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.isRead !== undefined) updateData.is_read = body.isRead;
      if (body.isArchived !== undefined) updateData.is_archived = body.isArchived;
      if (body.folder !== undefined) updateData.folder = body.folder;

      // Verify all emails belong to user's accounts
      const { data: emails } = await supabase
        .from('emails')
        .select(`
          id,
          email_accounts!inner(user_id)
        `)
        .in('id', body.ids)
        .eq('email_accounts.user_id', user.id);

      if (!emails || emails.length !== body.ids.length) {
        return error('FORBIDDEN', 'Some emails not found or access denied', undefined, 403);
      }

      const { error: dbError } = await supabase
        .from('emails')
        .update(updateData)
        .in('id', body.ids);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to update emails', dbError);
      }

      return success({ success: true, count: body.ids.length });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

