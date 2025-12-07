// =====================================
// FLUX - Login Page (Hero)
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useFluxStore } from '@/lib/store';
import { Vortex } from '@/components/ui/vortex';

export default function HeroPage() {
    const navigate = useNavigate();
    const { setUser } = useFluxStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (data.user) {
                setUser({
                    id: data.user.id,
                    email: data.user.email!,
                    name: data.user.user_metadata.name || 'User',
                    role: data.user.user_metadata.role || 'member',
                    avatar: data.user.user_metadata.avatar,
                    preferences: data.user.user_metadata.preferences
                });

                navigate('/app/dashboard');
            }
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: '#000000',
                overflow: 'hidden'
            }}
        >
            {/* Vortex background - full viewport */}
            <Vortex
                backgroundColor="black"
                rangeY={720}
                particleCount={450}
                baseHue={170}
                containerClassName="absolute inset-0 w-full h-full"
                className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
            />

            {/* Login form - centered */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                        width: '100%',
                        maxWidth: '380px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        backdropFilter: 'blur(24px)'
                    }}
                >
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <img 
                            src="/flux-logo-transparent.png" 
                            alt="Flux" 
                            style={{ 
                                width: '120px', 
                                height: 'auto', 
                                margin: '0 auto',
                                filter: 'drop-shadow(0 4px 12px rgba(124, 58, 237, 0.3))'
                            }} 
                        />
                        <p style={{ 
                            color: 'rgba(255,255,255,0.6)', 
                            fontSize: '14px', 
                            marginTop: '12px' 
                        }}>
                            Sign in to your workspace
                        </p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                            style={{
                                width: '100%',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(124, 58, 237, 0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            style={{
                                width: '100%',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'rgba(124, 58, 237, 0.5)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#fda4af',
                                    fontSize: '13px',
                                    background: 'rgba(244, 63, 94, 0.15)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(244, 63, 94, 0.2)'
                                }}
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: loading ? 'rgba(124, 58, 237, 0.5)' : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                color: 'white',
                                fontWeight: 600,
                                padding: '14px',
                                borderRadius: '12px',
                                border: 'none',
                                marginTop: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '15px',
                                boxShadow: '0 8px 16px -4px rgba(124, 58, 237, 0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 20px -4px rgba(124, 58, 237, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(124, 58, 237, 0.4)';
                            }}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" style={{ width: '20px', height: '20px' }} />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{ 
                        textAlign: 'center', 
                        marginTop: '24px', 
                        fontSize: '13px', 
                        color: 'rgba(255,255,255,0.4)' 
                    }}>
                        Don't have an account?{' '}
                        <span style={{ color: '#a855f7', cursor: 'pointer' }}>
                            Contact your admin
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
// 21:11:22 Dec 06, 2025
