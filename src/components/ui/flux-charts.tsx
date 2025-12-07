// @ts-nocheck
import React, { ReactNode } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    TooltipProps,
} from 'recharts';
import { cn } from '@/lib/utils'; // Use our app's utils

// --- Types ---

export interface ChartDataPoint {
    name: string;
    valueA?: number;
    valueB?: number;
    [key: string]: any;
}

export interface DonutDataPoint {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

interface FluxChartProps {
    title?: string;
    data: ChartDataPoint[];
    height?: number;
    className?: string;
}

interface DonutChartProps {
    title?: string;
    data: DonutDataPoint[];
    height?: number;
}

interface StatCardProps {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    data: ChartDataPoint[]; // For sparkline
    color?: string;
}

// --- Internal Components ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white text-xs py-2 px-3 rounded-lg shadow-xl border border-slate-700/50 backdrop-blur-md">
                <p className="font-semibold mb-1 text-slate-300">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 my-0.5">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-100 font-medium">
                            {entry.name}: {entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Exported Components ---

export const LineChartWidget: React.FC<FluxChartProps> = ({
    title,
    data,
    height = 300,
    className = "",
}) => {
    return (
        <div className={cn("bg-card p-6 rounded-3xl shadow-sm border border-border", className)}>
            {title && (
                <h3 className="text-lg font-semibold text-card-foreground mb-6 tracking-tight">
                    {title}
                </h3>
            )}
            <div style={{ width: '100%', height }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                            strokeOpacity={0.2}
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="valueA"
                            name="Revenue"
                            stroke="#7c3aed"
                            fillOpacity={1}
                            fill="url(#colorA)"
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="valueB"
                            name="Engagement"
                            stroke="#ec4899"
                            fillOpacity={1}
                            fill="url(#colorB)"
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#ec4899' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const DonutChartWidget: React.FC<DonutChartProps> = ({
    title,
    data,
    height = 300,
}) => {
    return (
        <div className="bg-card p-6 rounded-3xl shadow-sm border border-border flex flex-col items-center justify-center h-full">
            {title && (
                <h3 className="text-lg font-semibold text-card-foreground mb-2 tracking-tight w-full text-left">
                    {title}
                </h3>
            )}
            <div style={{ width: '100%', height, position: 'relative' }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                            cornerRadius={8}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Label Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-foreground">
                        {data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                        Total Users
                    </span>
                </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground font-medium">
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    trend,
    trendUp,
    data,
    color = "#7c3aed",
}) => {
    return (
        <div className="relative overflow-hidden bg-card rounded-3xl shadow-sm border border-border h-48 transition-all hover:shadow-md">
            <div className="relative z-10 p-6 flex flex-col h-full justify-between pointer-events-none">
                <div>
                    <h4 className="text-muted-foreground font-medium text-sm tracking-wide uppercase">
                        {label}
                    </h4>
                    <div className="text-4xl font-bold text-foreground mt-2 tracking-tight">
                        {value}
                    </div>
                </div>
                {trend && (
                    <div
                        className={`flex items-center gap-1 text-sm font-semibold ${trendUp ? 'text-emerald-500' : 'text-rose-500'
                            }`}
                    >
                        {trendUp ? '↑' : '↓'} {trend}
                        <span className="text-slate-400 font-normal ml-1">vs last month</span>
                    </div>
                )}
            </div>

            {/* Background Sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-24 w-full opacity-20 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={3}
                            fill={`url(#gradient-${label})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
