// @ts-nocheck
import React from 'react';
import { LineChartWidget, DonutChartWidget, StatCard, ChartDataPoint, DonutDataPoint } from '@/components/ui/flux-charts';

// --- Mock Data ---

const MONTHLY_DATA: ChartDataPoint[] = [
    { name: 'Jan', valueA: 4000, valueB: 2400 },
    { name: 'Feb', valueA: 3000, valueB: 1398 },
    { name: 'Mar', valueA: 2000, valueB: 9800 },
    { name: 'Apr', valueA: 2780, valueB: 3908 },
    { name: 'May', valueA: 1890, valueB: 4800 },
    { name: 'Jun', valueA: 2390, valueB: 3800 },
    { name: 'Jul', valueA: 3490, valueB: 4300 },
    { name: 'Aug', valueA: 4200, valueB: 5100 },
    { name: 'Sep', valueA: 5600, valueB: 6200 },
    { name: 'Oct', valueA: 6100, valueB: 6900 },
    { name: 'Nov', valueA: 5900, valueB: 6500 },
    { name: 'Dec', valueA: 6500, valueB: 7100 },
];

const SPARKLINE_DATA_1: ChartDataPoint[] = Array.from({ length: 20 }, (_, i) => ({
    name: i.toString(),
    value: Math.random() * 100 + 50,
}));

const SPARKLINE_DATA_2: ChartDataPoint[] = Array.from({ length: 20 }, (_, i) => ({
    name: i.toString(),
    value: Math.random() * 100 + 20,
}));

const SPARKLINE_DATA_3: ChartDataPoint[] = Array.from({ length: 20 }, (_, i) => ({
    name: i.toString(),
    value: Math.random() * 100 + 80,
}));

const USER_SEGMENTS: DonutDataPoint[] = [
    { name: 'Pro', value: 430, color: '#7c3aed' },      // Violet
    { name: 'Basic', value: 890, color: '#a78bfa' },    // Light Violet
    { name: 'Enterprise', value: 210, color: '#ec4899' }, // Pink
];

// --- Page Component ---

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 shadow-lg shadow-violet-500/30 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3v18h18" />
                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Flux Analytics</h1>
                    </div>
                    <p className="text-muted-foreground">Real-time visualization of system metrics and performance.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => alert("Time range selector - Coming soon")}
                        className="px-4 py-2 bg-card border border-border text-muted-foreground rounded-full text-sm font-medium hover:bg-muted transition-colors shadow-sm"
                    >
                        Last 24 Hours
                    </button>
                    <button
                        onClick={() => alert("Generating report...")}
                        className="px-4 py-2 bg-slate-900 dark:bg-violet-600 text-white rounded-full text-sm font-medium hover:bg-slate-800 dark:hover:bg-violet-500 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-violet-600/20"
                    >
                        Generate Report
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    label="Total Revenue"
                    value="$128,490"
                    trend="12.5%"
                    trendUp={true}
                    data={SPARKLINE_DATA_1}
                    color="#7c3aed"
                />
                <StatCard
                    label="Active Users"
                    value="45.2k"
                    trend="3.1%"
                    trendUp={true}
                    data={SPARKLINE_DATA_2}
                    color="#ec4899"
                />
                <StatCard
                    label="Avg. Session Duration"
                    value="4m 12s"
                    trend="1.2%"
                    trendUp={false}
                    data={SPARKLINE_DATA_3}
                    color="#6366f1"
                />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-full">
                    <LineChartWidget
                        title="Performance Overview"
                        data={MONTHLY_DATA}
                        height={400}
                        className="h-full"
                    />
                </div>
                <div className="h-full">
                    <DonutChartWidget
                        title="User Segmentation"
                        data={USER_SEGMENTS}
                        height={320}
                    />
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                <LineChartWidget
                    title="Server Load (East US)"
                    data={MONTHLY_DATA.map(d => ({ ...d, valueA: d.valueB, valueB: d.valueA }))} // Swapped for variety
                    height={300}
                />
                <LineChartWidget
                    title="API Latency (ms)"
                    data={MONTHLY_DATA.slice(0, 8)}
                    height={300}
                />
            </div>
        </div>
    );
}
