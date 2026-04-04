import React from 'react';
import { useSidebarState } from '../../context/SidebarStateContext';
import { useAuth } from '../../context/AuthContext';
import { FaMapMarkerAlt, FaStore, FaInfoCircle, FaSearch, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const CustomerSidebar = () => {
    const { currentSidebarState, activeModules, notes, inputSignals, signalBrowsing } = useSidebarState();
    const { user } = useAuth();

    // Helper to check if a module is visible
    const getModuleConfig = (moduleName) => activeModules.find(m => m.module === moduleName);

    return (
        <aside className="hidden lg:flex flex-col w-84 h-[calc(100vh-72px)] sticky top-[72px] bg-[var(--page-bg)] border-r border-black/5 overflow-y-auto p-10 transition-all duration-300">
            {/* Debug State Indicator (Dev Only) */}
            <div className="mb-10 bg-[var(--accent-terracotta)]/5 p-4 rounded-2xl text-[9px] items-center gap-3 hidden group-hover:flex border border-[var(--accent-terracotta)]/10 backdrop-blur-md">
                <span className="font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">STATE:</span>
                <span className="font-mono text-[var(--accent-terracotta)] font-black">{currentSidebarState}</span>
            </div>

            {/* 0. Profile Context */}
            {getModuleConfig('profile_context') && (
                <div className="mb-10 animate-fade-in-up">
                    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 opacity-50">Discovery Context</h3>
                    <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-black/5 shadow-standard mb-4">
                        <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-2xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center flex-shrink-0 shadow-inner">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[var(--text-primary)] leading-tight uppercase tracking-tight">
                                    {user?.customerLocation?.city || 'Vadodara'}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">
                                    Home location (manual)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 0.1 Discovery Preferences */}
            {getModuleConfig('discovery_preferences') && (
                <div className="mb-10 animate-fade-in-up delay-100">
                    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 opacity-50">Preferences Active</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <FaSearch className="text-[var(--text-muted)] text-[10px] opacity-40" />
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Nearby shops prioritized</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] shadow-[0_0_8px_var(--accent-green)]"></div>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Open shops shown first</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <FaCheck className="text-[var(--accent-orange)] text-[10px]" />
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Availability alerts enabled</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Location Anchor */}
            {getModuleConfig('location_anchor') && (
                <div className="mb-10 animate-fade-in-up">
                    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 opacity-50">Your Location</h3>
                    <div className="bg-[var(--accent-orange)]/5 p-5 rounded-2xl border border-[var(--accent-orange)]/10 shadow-inner">
                        <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-2xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center flex-shrink-0">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[var(--text-primary)] leading-tight uppercase tracking-tight">
                                    {user?.customerLocation?.area || 'Connaught Place'}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">
                                    {user?.customerLocation?.city || 'New Delhi'}
                                </p>
                            </div>
                        </div>
                        {currentSidebarState === 'orientation' && (
                            <p className="text-[9px] text-[var(--accent-orange)] mt-4 font-black uppercase tracking-widest leading-relaxed opacity-80">
                                We’re showing shops visible to you right now.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* 2. Shop Availability */}
            {getModuleConfig('shop_availability') && (
                <div className="mb-10 animate-fade-in-up delay-100">
                    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 opacity-50">Availability</h3>
                    <div className="space-y-3">
                        {inputSignals.openShopsCount > 0 ? (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 text-[var(--accent-green)] shadow-sm">
                                <FaStore className="text-lg" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{inputSignals.openShopsCount} Shops Active</p>
                                    <p className="text-[9px] font-black uppercase tracking-tight opacity-70 mt-0.5">Sellers are responding now</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 border border-black/5 text-[var(--text-muted)] shadow-inner">
                                <FaStore className="text-lg opacity-30" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Limited Activity</p>
                                    <p className="text-[9px] font-black uppercase tracking-tight opacity-50 mt-0.5">Many shops are closed</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Intent Lens (Categories) */}
            {getModuleConfig('intent_lens') && (
                <div className="mb-10 animate-fade-in-up delay-200">
                    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 opacity-50">
                        {currentSidebarState === 'intent_discovery' ? 'Explore Categories' : 'Quick Actions'}
                    </h3>

                    <div className="grid grid-cols-1 gap-2">
                        {['Daily Essentials', 'Pharmacy', 'Fruits & Veg', 'Stationery'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => signalBrowsing(cat)}
                                className={`text-left text-[10px] font-black uppercase tracking-[0.15em] px-4 py-3.5 rounded-xl transition-all flex items-center justify-between group
                                    ${currentSidebarState === 'active_search' ? 'text-[var(--text-muted)] opacity-50 hover:opacity-100' : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--accent-orange)]'}
                                `}
                            >
                                {cat}
                                <span className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] transition-all transform translate-x-[-10px] group-hover:translate-x-0">›</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Confidence Signals (AI) */}
            {getModuleConfig('confidence_signals') && (
                <div className="mb-10 animate-fade-in-up delay-300 bg-[var(--card-bg)] p-6 rounded-[24px] border border-black/5 shadow-standard">
                    <h3 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 opacity-50 flex items-center gap-2">
                        Match Confidence
                    </h3>
                    <div className="relative">
                        <div className="flex items-baseline justify-between mb-3">
                            <span className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">
                                {(inputSignals.confidenceScore * 100).toFixed(0)}%
                            </span>
                            <span className="text-[9px] font-black text-[var(--accent-green)] uppercase tracking-widest opacity-80">
                                High Certainty
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-green)] transition-all duration-1000 ease-out"
                                style={{ width: `${inputSignals.confidenceScore * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-5 font-black uppercase tracking-tight leading-relaxed opacity-60">
                            Based on inventory data and recent seller activity in your area.
                        </p>
                    </div>
                </div>
            )}

            {/* 5. Exploration Recovery */}
            {getModuleConfig('alternate_intents') && (
                <div className="mb-10 animate-fade-in-up delay-300">
                    <div className="bg-[var(--accent-orange)]/5 p-6 rounded-[24px] border border-[var(--accent-orange)]/10 shadow-inner">
                        <div className="flex items-start gap-4 mb-3">
                            <FaExclamationTriangle className="text-[var(--accent-orange)] mt-0.5 opacity-60" />
                            <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tight">Looking for something else?</p>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-tight leading-relaxed mb-6 opacity-70">
                            Shops nearby don’t reliably carry this exact item right now. You can try exploring similar options:
                        </p>
                        <div className="space-y-2">
                            <button className="w-full text-left text-[9px] font-black text-[var(--text-primary)] bg-black/5 hover:bg-[var(--accent-orange)] hover:text-black px-4 py-3 rounded-xl transition-all border border-black/5 uppercase tracking-widest shadow-inner">
                                Check General Stores
                            </button>
                            <button className="w-full text-left text-[9px] font-black text-[var(--text-primary)] bg-black/5 hover:bg-[var(--accent-orange)] hover:text-black px-4 py-3 rounded-xl transition-all border border-black/5 uppercase tracking-widest shadow-inner">
                                View All Open Shops
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Guidance */}
            <div className="mt-auto border-t border-black/5 pt-6 opacity-40 hover:opacity-100 transition-opacity">
                <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-[0.3em] mb-2 leading-none">Protocol Guidance</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-black italic tracking-tight leading-relaxed">
                    "{notes}"
                </p>
            </div>

        </aside>
    );
};

export default CustomerSidebar;
