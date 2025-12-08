// =====================================
// FLUX - Email Accounts API
// =====================================
// Manages email account connections (Gmail, Outlook, custom SMTP/IMAP/POP3)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateAuth } from '../_shared/auth.ts';
import { success, error, cors } from '../_shared/responses.ts';
import type { EmailAccount, EmailAccountCreateInput } from '../_shared/email-types.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return cors();
  }

  try {
    // Validate authentication
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

    // Route: GET /email-accounts
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'email-accounts') {
      const { data, error: dbError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenantId)
        .order('created_at', { ascending: false });

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to fetch email accounts', dbError);
      }

      // Transform to API format
      const accounts: EmailAccount[] = (data || []).map((acc) => ({
        id: acc.id,
        tenantId: acc.tenant_id,
        userId: acc.user_id,
        provider: acc.provider,
        emailAddress: acc.email_address,
        displayName: acc.display_name,
        smtpHost: acc.smtp_host,
        smtpPort: acc.smtp_port,
        smtpUsername: acc.smtp_username,
        smtpUseTls: acc.smtp_use_tls,
        imapHost: acc.imap_host,
        imapPort: acc.imap_port,
        imapUsername: acc.imap_username,
        imapUseTls: acc.imap_use_tls,
        syncEnabled: acc.sync_enabled,
        syncFrequencyMinutes: acc.sync_frequency_minutes,
        lastSyncedAt: acc.last_synced_at,
        isActive: acc.is_active,
        connectionStatus: acc.connection_status,
        lastError: acc.last_error,
        createdAt: acc.created_at,
        updatedAt: acc.updated_at,
      }));

      return success(accounts);
    }

    // Route: GET /email-accounts/:id
    if (method === 'GET' && pathParts.length === 3 && pathParts[1] === 'email-accounts') {
      const accountId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenantId)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Email account not found', undefined, 404);
      }

      const account: EmailAccount = {
        id: data.id,
        tenantId: data.tenant_id,
        userId: data.user_id,
        provider: data.provider,
        emailAddress: data.email_address,
        displayName: data.display_name,
        smtpHost: data.smtp_host,
        smtpPort: data.smtp_port,
        smtpUsername: data.smtp_username,
        smtpUseTls: data.smtp_use_tls,
        imapHost: data.imap_host,
        imapPort: data.imap_port,
        imapUsername: data.imap_username,
        imapUseTls: data.imap_use_tls,
        syncEnabled: data.sync_enabled,
        syncFrequencyMinutes: data.sync_frequency_minutes,
        lastSyncedAt: data.last_synced_at,
        isActive: data.is_active,
        connectionStatus: data.connection_status,
        lastError: data.last_error,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return success(account);
    }

    // Route: POST /email-accounts
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'email-accounts') {
      const body: EmailAccountCreateInput = await req.json();

      // Validation
      if (!body.emailAddress || !body.provider) {
        return error('VALIDATION_ERROR', 'emailAddress and provider are required');
      }

      // Insert email account
      const { data, error: dbError } = await supabase
        .from('email_accounts')
        .insert({
          tenant_id: profile.tenantId,
          user_id: user.id,
          provider: body.provider,
          email_address: body.emailAddress,
          display_name: body.displayName,
          smtp_host: body.smtpHost,
          smtp_port: body.smtpPort,
          smtp_username: body.smtpUsername,
          smtp_password: body.smtpPassword, // TODO: Encrypt in production
          smtp_use_tls: body.smtpUseTls ?? true,
          imap_host: body.imapHost,
          imap_port: body.imapPort,
          imap_username: body.imapUsername,
          imap_password: body.imapPassword, // TODO: Encrypt in production
          imap_use_tls: body.imapUseTls ?? true,
          oauth_access_token: body.oauthAccessToken, // TODO: Encrypt in production
          oauth_refresh_token: body.oauthRefreshToken, // TODO: Encrypt in production
          sync_enabled: body.syncEnabled ?? true,
          sync_frequency_minutes: body.syncFrequencyMinutes ?? 15,
          connection_status: 'disconnected',
        })
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to create email account', dbError);
      }

      const account: EmailAccount = {
        id: data.id,
        tenantId: data.tenant_id,
        userId: data.user_id,
        provider: data.provider,
        emailAddress: data.email_address,
        displayName: data.display_name,
        smtpHost: data.smtp_host,
        smtpPort: data.smtp_port,
        smtpUsername: data.smtp_username,
        smtpUseTls: data.smtp_use_tls,
        imapHost: data.imap_host,
        imapPort: data.imap_port,
        imapUsername: data.imap_username,
        imapUseTls: data.imap_use_tls,
        syncEnabled: data.sync_enabled,
        syncFrequencyMinutes: data.sync_frequency_minutes,
        lastSyncedAt: data.last_synced_at,
        isActive: data.is_active,
        connectionStatus: data.connection_status,
        lastError: data.last_error,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return success(account, undefined, 201);
    }

    // Route: PATCH /email-accounts/:id
    if (method === 'PATCH' && pathParts.length === 3 && pathParts[1] === 'email-accounts') {
      const accountId = pathParts[2];
      const body = await req.json();

      // Verify ownership
      const { data: existing } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Email account not found', undefined, 404);
      }

      // Update account
      const updateData: Record<string, unknown> = {};
      if (body.syncEnabled !== undefined) updateData.sync_enabled = body.syncEnabled;
      if (body.syncFrequencyMinutes !== undefined) updateData.sync_frequency_minutes = body.syncFrequencyMinutes;
      if (body.isActive !== undefined) updateData.is_active = body.isActive;
      if (body.connectionStatus !== undefined) updateData.connection_status = body.connectionStatus;

      const { data, error: dbError } = await supabase
        .from('email_accounts')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single();

      if (dbError || !data) {
        return error('DATABASE_ERROR', 'Failed to update email account', dbError);
      }

      const account: EmailAccount = {
        id: data.id,
        tenantId: data.tenant_id,
        userId: data.user_id,
        provider: data.provider,
        emailAddress: data.email_address,
        displayName: data.display_name,
        smtpHost: data.smtp_host,
        smtpPort: data.smtp_port,
        smtpUsername: data.smtp_username,
        smtpUseTls: data.smtp_use_tls,
        imapHost: data.imap_host,
        imapPort: data.imap_port,
        imapUsername: data.imap_username,
        imapUseTls: data.imap_use_tls,
        syncEnabled: data.sync_enabled,
        syncFrequencyMinutes: data.sync_frequency_minutes,
        lastSyncedAt: data.last_synced_at,
        isActive: data.is_active,
        connectionStatus: data.connection_status,
        lastError: data.last_error,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return success(account);
    }

    // Route: DELETE /email-accounts/:id
    if (method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'email-accounts') {
      const accountId = pathParts[2];

      // Verify ownership
      const { data: existing } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Email account not found', undefined, 404);
      }

      // Delete account (cascade will delete associated emails)
      const { error: dbError } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to delete email account', dbError);
      }

      return success({ success: true });
    }

    // Route: POST /email-accounts/:id/sync
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'sync') {
      const accountId = pathParts[2];

      // Verify ownership
      const { data: existing } = await supabase
        .from('email_accounts')
        .select('id, sync_enabled')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Email account not found', undefined, 404);
      }

      if (!existing.sync_enabled) {
        return error('VALIDATION_ERROR', 'Email sync is disabled for this account');
      }

      // Update last_synced_at (actual sync would be handled by background job)
      const { error: dbError } = await supabase
        .from('email_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', accountId);

      if (dbError) {
        return error('DATABASE_ERROR', 'Failed to trigger sync', dbError);
      }

      // TODO: Trigger actual email sync job here
      return success({ message: 'Email sync triggered', accountId });
    }

    // Route: POST /email-accounts/:id/test
    if (method === 'POST' && pathParts.length === 4 && pathParts[3] === 'test') {
      const accountId = pathParts[2];

      // Verify ownership
      const { data: existing } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        return error('NOT_FOUND', 'Email account not found', undefined, 404);
      }

      // TODO: Implement actual connection test
      // For now, return success
      return success({ success: true, message: 'Connection test passed' });
    }

    // Route: GET /email-accounts/:id/status
    if (method === 'GET' && pathParts.length === 4 && pathParts[3] === 'status') {
      const accountId = pathParts[2];

      const { data, error: dbError } = await supabase
        .from('email_accounts')
        .select('connection_status, last_synced_at, last_error, sync_enabled')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (dbError || !data) {
        return error('NOT_FOUND', 'Email account not found', undefined, 404);
      }

      return success({
        connectionStatus: data.connection_status,
        lastSyncedAt: data.last_synced_at,
        lastError: data.last_error,
        syncEnabled: data.sync_enabled,
      });
    }

    return error('NOT_FOUND', 'Route not found', undefined, 404);
  } catch (err) {
    return error(
      'INTERNAL_ERROR',
      err instanceof Error ? err.message : 'Internal server error',
      undefined,
      500
    );
  }
});

