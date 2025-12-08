// =====================================
// FLUX - Tasks API
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

    // Helper to transform DB task to API format
    const transformTask = (db: any) => ({
      id: db.id,
      title: db.title,
      description: db.description || '',
      status: db.status,
      priority: db.priority,
      tags: db.tags || [],
      assignee: db.assignee_id ? {
        id: db.assignee_id,
        name: db.assignee_name || 'Unknown',
        avatar: db.assignee_avatar,
      } : undefined,
      dueDate: db.due_date,
      projectId: db.project_id,
      order: db.order,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    });

    // GET /tasks
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'tasks') {
      const { limit, offset } = parsePagination(url);
      const projectId = url.searchParams.get('projectId');
      const status = url.searchParams.get('status');
      const priority = url.searchParams.get('priority');
      const assigneeId = url.searchParams.get('assigneeId');

      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenantId)
        .order('order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (projectId) query = query.eq('project_id', projectId);
      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      if (assigneeId) query = query.eq('assignee_id', assigneeId);

      const { data, error: dbError, count } = await query;

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch tasks', dbError);
      }

      const tasks = (data || []).map(transformTask);

      return success(tasks, {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // GET /tasks/:id
    if (method === 'GET' && pathParts.length === 3 && pathParts[1] === 'tasks') {
      const taskId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Task not found', undefined, 404);
      }

      return success(transformTask(data));
    }

    // POST /tasks
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'tasks') {
      const body = await req.json();
      if (!body.title) {
        return error('VALIDATION_ERROR', 'Title is required');
      }

      // Get max order for status
      const { data: maxOrder } = await supabase
        .from('tasks')
        .select('order')
        .eq('status', body.status || 'todo')
        .eq('tenant_id', profile.tenantId)
        .order('order', { ascending: false })
        .limit(1)
        .single();

      const newOrder = (maxOrder?.order ?? -1) + 1;

      const { data, error: dbError } = await supabase
        .from('tasks')
        .insert({
          tenant_id: profile.tenantId,
          title: body.title,
          description: body.description || '',
          status: body.status || 'todo',
          priority: body.priority || 'medium',
          tags: body.tags || [],
          assignee_id: body.assignee,
          due_date: body.dueDate,
          project_id: body.projectId,
          order: newOrder,
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create task', dbError);
      }

      return success(transformTask(data), undefined, 201);
    }

    // PATCH /tasks/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'tasks') {
      const taskId = pathParts[2];
      const body = await req.json();

      // Verify ownership via tenant
      const { data: existing } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Task not found', undefined, 404);
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.tags !== undefined) updateData.tags = body.tags;
      if (body.assignee !== undefined) updateData.assignee_id = body.assignee;
      if (body.dueDate !== undefined) updateData.due_date = body.dueDate;
      if (body.order !== undefined) updateData.order = body.order;

      const { data, error: dbError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update task', dbError);
      }

      return success(transformTask(data));
    }

    // DELETE /tasks/:id
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'tasks') {
      const taskId = pathParts[2];

      const { error: dbError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('tenant_id', profile.tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete task', dbError);
      }

      return success({ success: true });
    }

    // POST /tasks/:id/move
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'move') {
      const taskId = pathParts[2];
      const body = await req.json();

      if (!body.status) {
        return error('VALIDATION_ERROR', 'Status is required');
      }

      const { data, error: dbError } = await supabase
        .from('tasks')
        .update({
          status: body.status,
          order: body.order ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to move task', dbError);
      }

      return success(transformTask(data));
    }

    // POST /tasks/archive
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'archive') {
      const body = await req.json();
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return error('VALIDATION_ERROR', 'ids array is required');
      }

      const { error: dbError } = await supabase
        .from('tasks')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .in('id', body.ids)
        .eq('tenant_id', profile.tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to archive tasks', dbError);
      }

      return success({ success: true, count: body.ids.length });
    }

    // POST /tasks/bulk-update
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'bulk-update') {
      const body = await req.json();
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return error('VALIDATION_ERROR', 'ids array is required');
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.status !== undefined) updateData.status = body.status;
      if (body.priority !== undefined) updateData.priority = body.priority;

      const { error: dbError } = await supabase
        .from('tasks')
        .update(updateData)
        .in('id', body.ids)
        .eq('tenant_id', profile.tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to update tasks', dbError);
      }

      return success({ success: true, count: body.ids.length });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

