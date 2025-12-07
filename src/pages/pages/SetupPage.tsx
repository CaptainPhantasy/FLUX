// =====================================
// FLUX - Setup Page (Onboarding Gateway)
// Renders the High-Fidelity FluxSetupWizard
// =====================================

// @ts-nocheck
import { useNavigate } from 'react-router-dom';
import { FluxSetupWizard, type SetupConfig } from '@/features/onboarding';
import { useFluxStore } from '@/lib/store';
import type { StorageMode } from '@/types';

export default function SetupPage() {
    const navigate = useNavigate();
    const { initialize, completeOnboarding } = useFluxStore();

    // Get default values from environment if available
    const defaultUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const handleComplete = async (config: SetupConfig) => {
        try {
            // Map config type to our StorageMode
            // 'postgres' is treated as 'supabase' for now (same adapter pattern)
            const storageMode: StorageMode = config.type === 'local' ? 'local' : 'supabase';

            // Initialize the store with selected mode
            await initialize(storageMode);

            // Mark onboarding as complete (persisted to localStorage)
            completeOnboarding();

            // Navigate to the main app
            navigate('/app');
        } catch (error) {
            console.error('Setup failed:', error);
            // Still attempt to navigate with local fallback
            await initialize('local');
            completeOnboarding();
            navigate('/app');
        }
    };

    return (
        <FluxSetupWizard
            onComplete={handleComplete}
            defaultUrl={defaultUrl}
            defaultKey={defaultKey}
        />
    );
}
