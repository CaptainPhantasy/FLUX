// =====================================
// FLUX - Assets API
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

    // GET /assets
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'assets') {
      const { limit, offset } = parsePagination(url);
      const projectId = url.searchParams.get('projectId');

      let query = supabase
        .from('assets')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenantId)
        .order('uploaded_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (projectId) query = query.eq('project_id', projectId);

      const { data, error: dbError, count } = await query;

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch assets', dbError);
      }

      return success(data || [], {
        pagination: createPaginationMeta(count || 0, Math.floor(offset / limit) + 1, limit),
      });
    }

    // GET /assets/:id
    if (method === 'GET' && pathParts.length === 3 && pathParts[1] === 'assets') {
      const assetId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Asset not found', undefined, 404);
      }

      return success(data);
    }

    // POST /assets/upload
    if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'upload') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const projectId = formData.get('projectId') as string | null;

      if (!file) {
        return error('VALIDATION_ERROR', 'File is required');
      }

      // Upload to Supabase Storage
      const filePath = `${profile.tenantId}/${user.id}/${Date.now()}-${file.name}`;
      const fileBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('flux-assets')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
        });

      if (uploadError) {
        return error('STORAGE_ERROR', 'Failed to upload file', uploadError);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('flux-assets')
        .getPublicUrl(filePath);

      // Determine asset type
      const assetType = file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('video/') ? 'video' :
          file.type.startsWith('audio/') ? 'audio' :
            file.type.includes('document') || file.type.includes('pdf') ? 'document' : 'other';

      // Create asset record
      const { data, error: dbError } = await supabase
        .from('assets')
        .insert({
          tenant_id: profile.tenantId,
          name: file.name,
          type: assetType,
          url: publicUrl,
          size: file.size,
          mime_type: file.type,
          project_id: projectId,
          uploaded_by: user.id,
          tags: [],
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create asset record', dbError);
      }

      return success(data, undefined, 201);
    }

    // PATCH /assets/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'assets') {
      const assetId = pathParts[2];
      const body = await req.json();

      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.tags !== undefined) updateData.tags = body.tags;

      const { data, error: dbError } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', assetId)
        .eq('tenant_id', profile.tenantId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update asset', dbError);
      }

      return success(data);
    }

    // DELETE /assets/:id
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'assets') {
      const assetId = pathParts[2];

      // Get asset to delete from storage
      const { data: asset } = await supabase
        .from('assets')
        .select('url')
        .eq('id', assetId)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (!asset) {
        return error('NOT_FOUND', 'Asset not found', undefined, 404);
      }

      // Delete from storage
      if (asset.url) {
        const path = asset.url.split('/flux-assets/')[1];
        if (path) {
          await supabase.storage.from('flux-assets').remove([path]);
        }
      }

      // Delete record
      const { error: dbError } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete asset', dbError);
      }

      return success({ success: true });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Internal server error', undefined, 500);
  }
});

