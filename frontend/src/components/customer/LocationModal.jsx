import React from 'react';
import { createPortal } from 'react-dom';

const cities = ["Delhi", "Noida", "Gurgaon", "Vadodara", "Mumbai", "Bangalore"];

export default function LocationModal({ onSelect, onClose }) {
    return createPortal(
        <div className="fixed inset-0 bg-[#181411]/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <div className="bg-[var(--card-bg)] rounded-[32px] w-full max-w-sm shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in-up border border-white/5">
                {/* ... existing city selection content ... */}
                <div className="p-8 border-b border-black/5">
                    <h3 className="text-2xl font-black text-[var(--text-primary)] leading-none mb-1 uppercase tracking-tight">Select your city</h3>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-50">Local Discovery Focus</p>
                </div>

                <div className="p-6 space-y-3">
                    {cities.map((city) => (
                        <button
                            key={city}
                            onClick={() => {
                                onSelect(city);
                                onClose();
                            }}
                            className="w-full text-left p-4 rounded-2xl border border-black/5 hover:border-[var(--accent-terracotta)]/50 hover:bg-[var(--accent-terracotta)]/10 transition-all font-black text-[var(--text-primary)] hover:text-[var(--accent-terracotta)] uppercase tracking-widest text-xs"
                        >
                            {city}
                        </button>
                    ))}
                </div>

                <div className="p-6 bg-black/5">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl text-[var(--text-muted)] font-black text-[10px] uppercase tracking-[0.3em] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
