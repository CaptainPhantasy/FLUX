// @ts-nocheck
// =====================================
// FLUX - Database Layer Index
// =====================================

export * from './types';
export { createLocalAdapter } from './adapters/local';
export { createSupabaseAdapter } from './adapters/supabase';

import type { FluxDataProvider, AdapterRegistry } from './types';
import { createLocalAdapter } from './adapters/local';
import { createSupabaseAdapter } from './adapters/supabase';
import type { StorageMode } from '@/types';

// Adapter registry
const adapters: AdapterRegistry = {
    local: createLocalAdapter,
    supabase: createSupabaseAdapter,
};

// Singleton instance holder
let currentAdapter: FluxDataProvider | null = null;
let currentMode: StorageMode | null = null;

/**
 * Get or create the database adapter based on storage mode
 */
export function getAdapter(mode: StorageMode): FluxDataProvider {
    if (currentAdapter && currentMode === mode) {
        return currentAdapter;
    }

    // If switching modes, disconnect existing adapter
    if (currentAdapter && currentMode !== mode) {
        currentAdapter.disconnect();
    }

    const factory = adapters[mode];
    if (!factory) {
        throw new Error(`Unknown storage mode: ${mode}`);
    }

    currentAdapter = factory();
    currentMode = mode;

    return currentAdapter;
}

/**
 * Initialize the database adapter
 */
export async function initializeDb(mode: StorageMode): Promise<FluxDataProvider> {
    const adapter = getAdapter(mode);
    await adapter.initialize();
    return adapter;
}

/**
 * Get current adapter (throws if not initialized)
 */
export function getCurrentAdapter(): FluxDataProvider {
    if (!currentAdapter) {
        throw new Error('Database not initialized. Call initializeDb() first.');
    }
    return currentAdapter;
}

/**
 * Check if database is initialized
 */
export function isDbInitialized(): boolean {
    return currentAdapter !== null;
}

/**
 * Get current storage mode
 */
export function getCurrentStorageMode(): StorageMode | null {
    return currentMode;
}
