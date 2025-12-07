// @ts-nocheck
import React, { useState } from 'react';
import { Search, ShoppingBag, Server, Monitor, Shield, Database, Smartphone, Cloud, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { suggestServices } from '../services/geminiService';

const CATEGORIES = [
    { id: 'hardware', name: 'Hardware', icon: Monitor },
    { id: 'software', name: 'Software', icon: Database },
    { id: 'access', name: 'Access', icon: Shield },
    { id: 'cloud', name: 'Cloud Services', icon: Cloud },
    { id: 'mobile', name: 'Mobile', icon: Smartphone },
];

const SERVICES = [
    { id: 's1', name: 'New Laptop Request', category: 'Hardware', description: 'Request a standard developer or business laptop.' },
    { id: 's2', name: 'VPN Access', category: 'Access', description: 'Remote access setup for secure connection.' },
    { id: 's3', name: 'AWS Bucket Provisioning', category: 'Cloud Services', description: 'Create a new S3 bucket for project storage.' },
    { id: 's4', name: 'Software License: Adobe Creative Cloud', category: 'Software', description: 'Monthly subscription for design tools.' },
    { id: 's5', name: 'Mobile Device Enrollment', category: 'Mobile', description: 'Register your device in MDM.' },
    { id: 's6', name: 'Database Restoration', category: 'Software', description: 'Request restoration of DB from backup.' },
];

export const ServiceCatalog: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredServices, setFilteredServices] = useState(SERVICES);
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            // Local filter
            const localResults = SERVICES.filter(s => 
                s.name.toLowerCase().includes(query.toLowerCase()) || 
                s.description.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredServices(localResults);
            
            // AI Suggestion if no direct results or just to enhance
            if (localResults.length === 0 || query.length > 5) {
                setIsSearching(true);
                const suggestedNames = await suggestServices(query, SERVICES.map(s => s.name));
                setSuggestions(suggestedNames);
                setIsSearching(false);
            } else {
                setSuggestions([]);
            }
        } else {
            setFilteredServices(SERVICES);
            setSuggestions([]);
        }
    };

    const handleRequest = (serviceName: string) => {
        setSuccessMsg(`Request for "${serviceName}" has been submitted successfully.`);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            {/* Success Toast */}
            {successMsg && (
                <div className="absolute top-0 right-0 left-0 z-50 flex justify-center animate-in slide-in-from-top-4 fade-in">
                    <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                        <CheckCircle size={20} />
                        <span className="font-medium">{successMsg}</span>
                    </div>
                </div>
            )}

            <div className="text-center py-10 bg-gradient-to-r from-flux-500 to-indigo-600 rounded-2xl shadow-lg text-white">
                <h2 className="text-3xl font-bold mb-4">How can we help you today?</h2>
                <div className="max-w-2xl mx-auto px-4 relative">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Describe what you need (e.g., 'I need a new computer for design work')..."
                        className="w-full px-6 py-4 rounded-xl text-gray-900 shadow-xl focus:ring-4 focus:ring-white/30 outline-none text-lg"
                    />
                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {isSearching ? <span className="animate-spin">⌛</span> : <Search size={24} />}
                    </div>
                </div>
                {suggestions.length > 0 && (
                    <div className="max-w-2xl mx-auto mt-4 flex justify-center gap-2 flex-wrap px-4">
                        <span className="text-sm text-white/80 flex items-center"><Zap size={14} className="mr-1"/> AI Suggestions:</span>
                        {suggestions.map(s => (
                            <button 
                                key={s} 
                                onClick={() => handleSearch(s)}
                                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {CATEGORIES.map(cat => (
                    <div key={cat.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center space-y-2 group">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full group-hover:bg-flux-50 dark:group-hover:bg-flux-900/30 text-gray-500 dark:text-gray-400 group-hover:text-flux-600 transition-colors">
                            <cat.icon size={24} />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Popular Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                    {filteredServices.map(service => (
                        <div key={service.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col hover:border-flux-300 dark:hover:border-flux-700 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold text-flux-600 dark:text-flux-400 bg-flux-50 dark:bg-flux-900/20 px-2 py-1 rounded uppercase tracking-wider">
                                    {service.category}
                                </span>
                                <ShoppingBag size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-flux-500" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{service.name}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm flex-1">{service.description}</p>
                            <button 
                                onClick={() => handleRequest(service.name)}
                                className="mt-4 w-full py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-flux-50 dark:hover:bg-gray-700 hover:text-flux-600 dark:hover:text-white flex items-center justify-center gap-2 transition-all"
                            >
                                <span>Request Now</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
