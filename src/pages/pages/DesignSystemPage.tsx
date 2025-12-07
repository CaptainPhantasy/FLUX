// @ts-nocheck
// =====================================
// FLUX - Opus Experience (Claude-inspired)
// Customer-facing style guide for the warm Opus palette
// =====================================

import React from 'react';
import { Button, Badge, Card } from '@/components/ui';
import { 
    ArrowRight,
    Palette,
    Sparkles,
    Leaf
} from 'lucide-react';

export default function DesignSystemPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            
            <div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E67D22] to-[#C15F3C] flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        <Palette size={18} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Opus Experience</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Warm, approachable, and minimalist—Claude-inspired palette with primary orange, creamy neutrals, and warm grays for low-glare comfort.
                        </p>
                    </div>
                </div>
            </div>

            {/* Palette */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2 flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-500" /> Opus Palette
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { name: 'Opus Orange', hex: '#E67D22' },
                        { name: 'Deep Coral', hex: '#C15F3C' },
                        { name: 'Cream', hex: '#F4F3EE' },
                        { name: 'Warm Gray', hex: '#B1ADA1' },
                        { name: 'Muted Tan', hex: '#C4A584' },
                    ].map((color) => (
                        <Card key={color.name} padding="md" className="space-y-3">
                            <div className="h-14 w-full rounded-xl" style={{ backgroundColor: color.hex }} />
                            <div>
                                <p className="font-semibold">{color.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Buttons */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Buttons</h2>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary" size="lg">Primary</Button>
                    <Button variant="primary">Primary</Button>
                    <Button variant="primary" size="sm">Primary</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary">
                        Start
                        <ArrowRight size={16} className="ml-2" />
                    </Button>
                    <Button variant="secondary" size="icon">
                        <Leaf size={18} />
                    </Button>
                </div>
            </section>

            {/* Badges */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Badges</h2>
                <div className="flex flex-wrap gap-4">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-200/40">Opus</Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/40">Success</Badge>
                </div>
            </section>

            {/* Cards */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold border-b border-border pb-2">Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card padding="lg">
                        <h3 className="font-semibold mb-2">Default Card</h3>
                        <p className="text-sm text-muted-foreground">Warm neutral surface with balanced contrast.</p>
                    </Card>
                    
                    <Card padding="lg" variant="flat">
                        <h3 className="font-semibold mb-2">Flat Card</h3>
                        <p className="text-sm text-muted-foreground">Low emphasis, no elevation.</p>
                    </Card>

                    <Card padding="lg" className="border-orange-300/50 bg-orange-500/5">
                        <div className="flex items-center gap-3 mb-2">
                            <Sparkles size={18} className="text-orange-500" />
                            <h3 className="font-semibold text-orange-600 dark:text-orange-400">Highlight Card</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Use for active states or key callouts.</p>
                    </Card>
                </div>
            </section>

             <div className="text-xs text-slate-400 mt-12 border-t border-border pt-4 flex justify-between">
                 <span>Opus Experience — Claude-inspired theme</span>
                 <span>Dec 07, 2025</span>
            </div>
        </div>
    );
}

