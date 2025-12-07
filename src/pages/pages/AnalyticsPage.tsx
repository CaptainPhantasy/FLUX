// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { LineChartWidget, DonutChartWidget, StatCard, ChartDataPoint, DonutDataPoint } from '@/components/ui/flux-charts';
import { useFluxStore } from '@/lib/store';
import { Button, Modal } from '@/components/ui';
import { Calendar, Download, FileText, Check } from 'lucide-react';

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

const TIME_RANGES = [
    { label: 'Last 24 Hours', value: '24h', days: 1 },
    { label: 'Last 7 Days', value: '7d', days: 7 },
    { label: 'Last 30 Days', value: '30d', days: 30 },
    { label: 'Last 90 Days', value: '90d', days: 90 },
    { label: 'This Year', value: 'year', days: 365 },
];

// --- Page Component ---

export default function AnalyticsPage() {
    const { tasks, notifications } = useFluxStore();
    const [selectedRange, setSelectedRange] = useState(TIME_RANGES[1]);
    const [isRangeOpen, setIsRangeOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);

    // Calculate real stats from task data
    const taskStats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const highPriority = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
        
        return {
            total,
            completed,
            inProgress,
            highPriority,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }, [tasks]);

    // Task status distribution for donut chart
    const statusDistribution: DonutDataPoint[] = useMemo(() => [
        { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#7c3aed' },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
        { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' },
        { name: 'Other', value: tasks.filter(t => !['todo', 'in-progress', 'done'].includes(t.status)).length, color: '#94a3b8' },
    ].filter(d => d.value > 0), [tasks]);

    const handleGenerateReport = () => {
        setReportGenerated(false);
        // Simulate report generation
        setTimeout(() => {
            setReportGenerated(true);
        }, 1500);
    };

    const downloadReport = () => {
        const reportData = {
            generatedAt: new Date().toISOString(),
            timeRange: selectedRange.label,
            summary: {
                totalTasks: taskStats.total,
                completedTasks: taskStats.completed,
                inProgressTasks: taskStats.inProgress,
                completionRate: `${taskStats.completionRate}%`,
            },
            tasks: tasks.map(t => ({
                title: t.title,
                status: t.status,
                priority: t.priority,
                createdAt: t.createdAt,
            })),
        };
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flux-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setIsReportModalOpen(false);
    };

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
                    {/* Time Range Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsRangeOpen(!isRangeOpen)}
                            className="px-4 py-2 bg-card border border-border text-muted-foreground rounded-full text-sm font-medium hover:bg-muted transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Calendar size={14} />
                            {selectedRange.label}
                        </button>
                        {isRangeOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-overlay border border-border z-50 py-1">
                                {TIME_RANGES.map((range) => (
                    <button
                                        key={range.value}
                                        onClick={() => {
                                            setSelectedRange(range);
                                            setIsRangeOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                                            selectedRange.value === range.value 
                                                ? 'text-violet-600 dark:text-violet-400 font-medium' 
                                                : 'text-card-foreground'
                                        }`}
                    >
                                        {range.label}
                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="px-4 py-2 bg-slate-900 dark:bg-violet-600 text-white rounded-full text-sm font-medium hover:bg-slate-800 dark:hover:bg-violet-500 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-violet-600/20 flex items-center gap-2"
                    >
                        <FileText size={14} />
                        Generate Report
                    </button>
                </div>
            </header>

            {/* Stats Row - Using real task data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    label="Total Tasks"
                    value={taskStats.total.toString()}
                    trend={`${taskStats.highPriority} urgent`}
                    trendUp={false}
                    data={SPARKLINE_DATA_1}
                    color="#7c3aed"
                />
                <StatCard
                    label="Completion Rate"
                    value={`${taskStats.completionRate}%`}
                    trend={`${taskStats.completed} done`}
                    trendUp={true}
                    data={SPARKLINE_DATA_2}
                    color="#10b981"
                />
                <StatCard
                    label="In Progress"
                    value={taskStats.inProgress.toString()}
                    trend="active now"
                    trendUp={true}
                    data={SPARKLINE_DATA_3}
                    color="#3b82f6"
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
                        title="Task Status Distribution"
                        data={statusDistribution.length > 0 ? statusDistribution : USER_SEGMENTS}
                        height={320}
                    />
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                <LineChartWidget
                    title="Performance Trend"
                    data={MONTHLY_DATA.map(d => ({ ...d, valueA: d.valueB, valueB: d.valueA }))}
                    height={300}
                />
                <LineChartWidget
                    title="Productivity Metrics"
                    data={MONTHLY_DATA.slice(0, 8)}
                    height={300}
                />
            </div>

            {/* Report Generation Modal */}
            <Modal 
                isOpen={isReportModalOpen} 
                onClose={() => { setIsReportModalOpen(false); setReportGenerated(false); }}
                title="Generate Analytics Report"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-3">Report will include:</p>
                        <ul className="space-y-2 text-sm text-card-foreground">
                            <li className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-500" />
                                Task completion statistics
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-500" />
                                Status distribution breakdown
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-500" />
                                Priority analysis
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={14} className="text-emerald-500" />
                                Time range: {selectedRange.label}
                            </li>
                        </ul>
                    </div>

                    {reportGenerated ? (
                        <div className="flex flex-col items-center py-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                                <Check size={24} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-foreground font-medium">Report Ready!</p>
                            <p className="text-sm text-muted-foreground">Click download to save the report</p>
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => { setIsReportModalOpen(false); setReportGenerated(false); }}
                        >
                            Cancel
                        </Button>
                        {reportGenerated ? (
                            <Button onClick={downloadReport}>
                                <Download size={14} className="mr-2" />
                                Download Report
                            </Button>
                        ) : (
                            <Button onClick={handleGenerateReport}>
                                Generate
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
