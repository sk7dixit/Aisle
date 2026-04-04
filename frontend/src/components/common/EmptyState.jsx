import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInbox } from 'react-icons/fa';

const EmptyState = ({
    title = "No items found",
    message = "We couldn't find anything to show here.",
    actionLabel,
    actionRoute,
    icon
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-black/5 rounded-[40px] flex items-center justify-center mb-8 text-[var(--text-muted)] shadow-inner border border-black/5">
                {icon || <FaInbox className="text-4xl opacity-20" />}
            </div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3 uppercase tracking-tight">{title}</h2>
            <p className="text-[var(--text-muted)] max-w-xs mx-auto mb-10 font-black uppercase tracking-widest text-[10px] opacity-60 leading-relaxed">{message}</p>

            {actionLabel && actionRoute && (
                <button
                    onClick={() => navigate(actionRoute)}
                    className="px-10 py-4 bg-[var(--accent-terracotta)] text-white rounded-2xl font-black hover:bg-black transition-all shadow-xl active:scale-95 uppercase tracking-widest text-[10px]"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
