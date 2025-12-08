// =====================================
// FLUX - Analytics API
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

    // GET /analytics/summary
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'summary') {
      // Get task counts
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenantId);

      const { count: completedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenantId)
        .eq('status', 'done');

      const { count: inProgressTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenantId)
        .eq('status', 'in-progress');

      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenantId);

      return success({
        tasks: {
          total: totalTasks || 0,
          completed: completedTasks || 0,
          inProgress: inProgressTasks || 0,
        },
        projects: {
          total: totalProjects || 0,
        },
      });
    }

    // GET /analytics/task-distribution
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'task-distribution') {
      const { data, error: dbError } = await supabase
        .from('tasks')
        .select('status')
        .eq('tenant_id', profile.tenantId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch task distribution', dbError);
      }

      const distribution = (data || []).reduce((acc: Record<string, number>, task: any) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      return success(distribution);
    }

    // GET /analytics/velocity
    if (method === 'GET' && pathParts.length === 3 && pathParts[2] === 'velocity') {
      // TODO: Calculate velocity from completed sprints
      return success({ data: [], message: 'Velocity calculation pending' });
    }

    // GET /analytics/burndown/:sprintId
    if (method === 'GET' && pathParts.length === 4 && pathParts[2] === 'burndown') {
      const sprintId = pathParts[3];
      // TODO: Calculate burndown data
      return success({ data: [], message: 'Burndown calculation pending' });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

