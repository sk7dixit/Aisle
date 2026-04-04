import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { fetchNotifications } from '../../api/notificationApi';
import {
    FaCheckDouble,
    FaExclamationTriangle,
    FaInfoCircle,
    FaCalendarDay,
    FaBellSlash,
    FaChevronLeft,
    FaStore,
    FaRobot,
    FaBullhorn
} from 'react-icons/fa';

const CustomerNotifications = () => {
    const { markAsRead, markAllRead, refreshData } = useNotifications();
    const [allNotifications, setAllNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, SYSTEM, SELLER, ANNOUNCEMENT
    const navigate = useNavigate();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await fetchNotifications(1, 100);
            setAllNotifications(data.notifications);
        } catch (error) {
            console.error("Failed to load notification history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        await markAsRead(id);
        setAllNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        refreshData(); // Sync bell
    };

    const handleMarkAll = async () => {
        await markAllRead();
        setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        refreshData();
    };

    const getIcon = (type) => {
        const classes = "w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm";
        switch (type) {
            case 'SYSTEM': return <div className={`${classes} bg-[var(--accent-purple)]15 text-[var(--accent-purple)]`}><FaRobot /></div>;
            case 'SELLER': return <div className={`${classes} bg-[var(--accent-orange)]15 text-[var(--accent-orange)]`}><FaStore /></div>;
            case 'ANNOUNCEMENT': return <div className={`${classes} bg-[var(--accent-yellow)]15 text-[var(--accent-yellow)]`}><FaBullhorn /></div>;
            case 'ORDER': return <div className={`${classes} bg-[var(--accent-green)]15 text-[var(--accent-green)]`}><FaCheckDouble /></div>;
            default: return <div className={`${classes} bg-black/5 text-[var(--text-muted)]`}><FaInfoCircle /></div>;
        }
    };

    // Filters and Grouping
    const filteredAndGrouped = useMemo(() => {
        let list = allNotifications;
        if (activeFilter !== 'ALL') {
            list = list.filter(n => n.type === activeFilter);
        }

        // Grouping logic
        const groups = {};
        list.forEach(n => {
            const date = new Date(n.createdAt);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let label = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
            if (date.toDateString() === today.toDateString()) label = 'Today';
            else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';

            if (!groups[label]) groups[label] = [];
            groups[label].push(n);
        });

        return groups;
    }, [allNotifications, activeFilter]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-black/10 border-t-[var(--accent-orange)] rounded-full animate-spin"></div>
                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">Fetching updates</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--page-bg)] pb-24 font-sans">
            {/* Header Area (Integrated) */}
            <div className="bg-transparent border-b border-black/5 sticky top-[72px] z-30 px-6 py-8">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-11 h-11 rounded-xl bg-black/5 flex items-center justify-center text-[var(--text-primary)] hover:bg-black/10 transition-all active:scale-90"
                        >
                            <FaChevronLeft size={14} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Notifications</h1>
                            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Your ShopLens Activity</p>
                        </div>
                    </div>
                    {allNotifications.some(n => !n.isRead) && (
                        <button
                            onClick={handleMarkAll}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                        >
                            <FaCheckDouble /> Mark all read
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 md:px-12 pt-10 space-y-10">
                {/* Filters (Accented) */}
                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {['ALL', 'SYSTEM', 'SELLER', 'ANNOUNCEMENT'].map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all shadow-sm border ${activeFilter === f
                                ? 'bg-[var(--accent-orange)] text-black border-[var(--accent-orange)]'
                                : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-black/5 hover:border-black/10'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Content Groups */}
                <div className="space-y-12">
                    {Object.keys(filteredAndGrouped).length === 0 ? (
                        <div className="text-center py-24 bg-[var(--card-bg)] rounded-[24px] border border-black/5 shadow-standard">
                            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)] opacity-30">
                                <FaBellSlash size={32} />
                            </div>
                            <h3 className="text-[var(--text-primary)] font-black text-2xl tracking-tight uppercase">You’re all caught up!</h3>
                            <p className="text-[var(--text-secondary)] font-medium mt-3 text-sm">When something happens, we'll let you know here.</p>
                        </div>
                    ) : (
                        Object.entries(filteredAndGrouped).map(([label, items]) => (
                            <div key={label} className="space-y-5">
                                <div className="flex items-center gap-4 px-2">
                                    <FaCalendarDay className="text-[var(--text-muted)] opacity-40" size={12} />
                                    <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{label}</h2>
                                    <div className="flex-1 h-px bg-black/5"></div>
                                </div>

                                <div className="grid gap-5">
                                    {items.map(notif => (
                                        <div
                                            key={notif._id}
                                            onClick={() => {
                                                if (notif.actionUrl) navigate(notif.actionUrl);
                                                if (!notif.isRead) handleMarkRead(notif._id);
                                            }}
                                            className={`group relative p-6 bg-[var(--card-bg)] rounded-[20px] border transition-all hover:shadow-standard hover:translate-y-[-2px] cursor-pointer ${notif.isRead ? 'border-black/5 shadow-sm' : 'border-[var(--accent-orange)]/30 ring-2 ring-[var(--accent-orange)]/5'
                                                }`}
                                        >
                                            <div className="flex gap-5">
                                                <div className="flex-shrink-0">
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-1.5">
                                                        <h3 className={`text-lg pr-10 leading-tight tracking-tight uppercase ${notif.isRead ? 'font-bold text-[var(--text-primary)] opacity-80' : 'font-black text-[var(--text-primary)]'}`}>
                                                            {notif.title}
                                                        </h3>
                                                        <span className="text-[9px] font-black text-[var(--text-muted)] bg-black/5 px-2.5 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap">
                                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm leading-relaxed line-clamp-2 ${notif.isRead ? 'text-[var(--text-muted)] font-medium' : 'text-[var(--text-secondary)] font-bold'}`}>
                                                        {notif.message}
                                                    </p>

                                                    {notif.actionUrl && (
                                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-[var(--accent-orange)] uppercase tracking-widest">
                                                            View Details <FaChevronLeft size={8} className="rotate-180" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {!notif.isRead && (
                                                <div className="absolute top-8 right-8 w-3 h-3 rounded-full bg-[var(--accent-orange)] shadow-[0_0_15px_rgba(247,127,0,0.4)]"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerNotifications;
