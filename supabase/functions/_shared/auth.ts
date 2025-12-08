// =====================================
// FLUX - Shared Auth Utilities
// =====================================
// Reusable authentication and authorization helpers for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  user: { id: string; email?: string };
  profile: {
    id: string;
    tenantId: string;
    roleId: string;
    isSuperAdmin: boolean;
  };
  supabase: ReturnType<typeof createClient>;
}

export interface AuthResult {
  success: boolean;
  context?: AuthContext;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Validate authentication and get user context
 */
export async function validateAuth(
  req: Request,
  requireSuperAdmin = false
): Promise<AuthResult> {
  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' },
      };
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
      };
    }

    // Get user profile for tenant_id and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tenant_id, role_id, is_super_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'User profile not found' },
      };
    }

    if (!profile.tenant_id) {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'User not assigned to tenant' },
      };
    }

    // Check super admin requirement
    if (requireSuperAdmin && !profile.is_super_admin) {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Super admin access required' },
      };
    }

    return {
      success: true,
      context: {
        user: { id: user.id, email: user.email },
        profile: {
          id: profile.id,
          tenantId: profile.tenant_id,
          roleId: profile.role_id,
          isSuperAdmin: profile.is_super_admin || false,
        },
        supabase,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
    };
  }
}

/**
 * Check if user has permission
 */
export async function hasPermission(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  permission: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_permission', {
    p_user_id: userId,
    p_permission: permission,
  });

  return !error && data === true;
}

