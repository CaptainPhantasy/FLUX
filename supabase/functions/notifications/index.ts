// =====================================
// FLUX - Notifications API
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

    const transformNotification = (db: any) => ({
      id: db.id,
      type: db.type,
      title: db.title,
      description: db.description,
      isRead: db.is_read,
      userId: db.user_id,
      context: db.context,
      createdAt: db.created_at,
    });

    // GET /notifications
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'notifications') {
      const { limit, offset } = parsePagination(url);
      const unreadOnly = url.searchParams.get('unread') === 'true';

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error: dbError, count } = await query;

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch notifications', dbError);
      }

      const notifications = (data || []).map(transformNotification);

      return success(notifications, {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // PATCH /notifications/:id/read
    if (method === 'PATCH' && pathParts.length === 4 && pathParts[3] === 'read') {
      const notificationId = pathParts[2];
      const body = await req.json();

      const { data, error: dbError } = await supabase
        .from('notifications')
        .update({ is_read: body.isRead !== false })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Notification not found', undefined, 404);
      }

      return success(transformNotification(data));
    }

    // POST /notifications/mark-all-read
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'mark-all-read') {
      const { error: dbError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenantId)
        .eq('is_read', false);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to mark all as read', dbError);
      }

      return success({ success: true });
    }

    // DELETE /notifications/:id
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'notifications') {
      const notificationId = pathParts[2];

      const { error: dbError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete notification', dbError);
      }

      return success({ success: true });
    }

    // DELETE /notifications (clear all)
    if (method === 'DELETE' && pathParts.length === 2 && pathParts[1] === 'notifications') {
      const { error: dbError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to clear notifications', dbError);
      }

      return success({ success: true });
    }

    // POST /notifications (create - for system/AI use)
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'notifications') {
      const body = await req.json();
      if (!body.title || !body.type) {
        return error('VALIDATION_ERROR', 'Title and type are required');
      }

      const { data, error: dbError } = await supabase
        .from('notifications')
        .insert({
          tenant_id: profile.tenantId,
          user_id: body.userId || user.id,
          type: body.type,
          title: body.title,
          description: body.description || '',
          is_read: false,
          context: body.context || {},
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create notification', dbError);
      }

      return success(transformNotification(data), undefined, 201);
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

