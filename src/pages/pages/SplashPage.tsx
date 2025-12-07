// =====================================
// FLUX - Splash Screen
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================

// @ts-nocheck
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WavyBackground } from '@/components/ui/WavyBackground';
import { Loader2 } from 'lucide-react';

export default function SplashPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 10000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <WavyBackground
            className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen"
            containerClassName="min-h-screen bg-[#020617]"
            colors={[
                "#a855f7", "#d946ef", "#06b6d4", "#8b5cf6", "#22d3ee"
            ]}
            waveWidth={50}
            blur={10}
            speed="fast"
            waveOpacity={0.5}
        >
            <button
                type="button"
                className="z-50 flex flex-col items-center justify-center p-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 rounded-xl bg-transparent"
                onClick={() => navigate('/login')}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate('/login');
                    }
                }}
                aria-label="Enter Flux app"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    // LOCKED POSITION: mt-[-200px] centers tagline on waves, logo above. DO NOT CHANGE.
                    className="flex flex-col items-center text-center mt-[-200px]"
                >
                    <div className="flex flex-col items-center justify-center">
                        <img
                            src="/flux-logo-transparent.png"
                            alt="Flux"
                            className="w-[300px] md:w-[400px] max-w-full object-contain drop-shadow-2xl z-10"
                        />

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="text-2xl md:text-4xl font-medium text-white/90 tracking-wide max-w-3xl leading-tight mt-[-120px] z-20 relative"
                        >
                            The AI-native PM for teams who ship fast.
                        </motion.h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 8, duration: 1 }}
                        className="mt-12"
                    >
                        <Loader2 className="w-8 h-8 text-violet-400/50 animate-spin" />
                    </motion.div>
                </motion.div>
            </button>
        </WavyBackground>
    );
}
// 21:11:22 Dec 06, 2025
