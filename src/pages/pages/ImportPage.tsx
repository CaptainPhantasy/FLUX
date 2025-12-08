// =====================================
// FLUX - Import Page
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
// @ts-nocheck
import React from 'react';
import { ImportWizard } from '@/components/ImportWizard';

export default function ImportPage() {
    return (
        <div className="space-y-6 h-[calc(100vh-100px)] pt-16 px-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Import</h1>
                    <p className="text-slate-500">Migrate tasks for other platforms.</p>
                </div>
            </div>
            <ImportWizard onClose={() => window.history.back()} />
        </div>
    );
}
// 21:11:22 Dec 06, 2025
