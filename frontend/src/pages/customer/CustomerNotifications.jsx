import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { fetchNotifications } from '../../api/notificationApi';
import { ChevronLeft, Check, Calendar, BellOff, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Static mockup alerts to ensure Aisle dashboard always feels active
const staticMocks = [
    {
        _id: 'mock-1',
        type: 'BUSINESSES',
        title: '🏪 Business Update',
        message: 'Fresh Mart added 20 new grocery items.',
        shopName: 'Fresh Mart',
        details: 'Added 20 new grocery items',
        actionText: 'View Shop',
        actionUrl: '/shops',
        priority: 'medium',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 mins ago
        isRead: false
    },
    {
        _id: 'mock-2',
        type: 'SERVICES',
        title: '🛠️ Service Available',
        message: 'Electrician available within 2 km.',
        details: 'Electrician available within 2 km',
        actionText: 'Request Service',
        actionUrl: '/services',
        priority: 'medium',
        createdAt: new Date(Date.now() - 20 * 60000).toISOString(), // 20 mins ago
        isRead: false
    },
    {
        _id: 'mock-3',
        type: 'BOOKINGS',
        title: '📅 Booking Confirmed',
        message: 'AC Repair booking confirmed.',
        details: 'Tomorrow • 10:00 AM',
        actionText: 'Track',
        actionUrl: '/bookings',
        priority: 'high',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
        isRead: false
    },
    {
        _id: 'mock-4',
        type: 'CREATORS',
        title: '🎨 New Collection',
        message: 'Riya Crafts launched a new handmade crochet collection.',
        details: 'Riya Crafts launched new collection',
        actionText: 'View Collection',
        actionUrl: '/creators',
        priority: 'medium',
        createdAt: new Date(Date.now() - 26 * 3600000).toISOString(), // 26 hours ago (Yesterday)
        isRead: true
    },
    {
        _id: 'mock-5',
        type: 'UPDATES',
        title: '❤️ Back In Stock',
        message: 'Organic Honey is now available again.',
        details: 'Now available again',
        actionText: 'View Product',
        actionUrl: '/categories',
        priority: 'high',
        createdAt: new Date(Date.now() - 28 * 86400000 / 24).toISOString(), // Yesterday
        isRead: true
    },
    {
        _id: 'mock-6',
        type: 'UPDATES',
        title: '🔒 Security Alert',
        message: 'Profile updated successfully.',
        details: 'Address and profile verified',
        actionText: 'View Settings',
        actionUrl: '/settings',
        priority: 'low',
        createdAt: new Date(Date.now() - 2.5 * 86400000).toISOString(), // 2.5 days ago (Older)
        isRead: true
    }
];

const CustomerNotifications = () => {
    const { markAsRead, markAllRead, refreshData } = useNotifications();
    const [allNotifications, setAllNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, BUSINESSES, SERVICES, BOOKINGS, CREATORS, UPDATES
    const [expandedGroups, setExpandedGroups] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await fetchNotifications(1, 100);
            
            // Map generic database types to ecosystem categories
            const dbMapped = (data.notifications || []).map(n => {
                const dbType = n.type || '';
                let type = 'UPDATES';
                if (dbType === 'SELLER' || dbType === 'INVENTORY') {
                    type = 'BUSINESSES';
                } else if (dbType === 'REQUEST' || dbType === 'SERVICE_REMINDER') {
                    type = 'SERVICES';
                } else if (dbType === 'ORDER' || dbType.startsWith('SERVICE_')) {
                    type = 'BOOKINGS';
                } else if (dbType === 'CREATOR' || dbType === 'CREATORS') {
                    type = 'CREATORS';
                } else if (dbType === 'SYSTEM' || dbType === 'ANNOUNCEMENT' || dbType === 'FEEDBACK') {
                    type = 'UPDATES';
                }

                // Map database priorities to lowercase
                let priority = 'low';
                const p = (n.priority || '').toLowerCase();
                if (['critical', 'important', 'high'].includes(p)) {
                    priority = 'high';
                } else if (['medium', 'normal'].includes(p)) {
                    priority = 'medium';
                }
                
                return {
                    ...n,
                    type,
                    priority,
                    title: n.title || (type === 'BUSINESSES' ? '🏪 Business Update' : '🔔 Notification'),
                    message: n.message
                };
            });

            // Combine backend and mock elements
            setAllNotifications([...dbMapped, ...staticMocks]);
        } catch (error) {
            console.error("Failed to load notifications, defaulting to mock feed", error);
            setAllNotifications(staticMocks);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        if (id.startsWith('mock-')) {
            // Simulated read for mock values
            setAllNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            return;
        }
        await markAsRead(id);
        setAllNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        refreshData();
    };

    const handleMarkAll = async () => {
        const realUnreadIds = allNotifications
            .filter(n => !n.isRead && !n._id.startsWith('mock-'))
            .map(n => n._id);

        if (realUnreadIds.length > 0) {
            await markAllRead();
        }

        setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        refreshData();
        toast.success("All notifications marked as read!");
    };

    const toggleExpandGroup = (groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    // Grouping similar notifications to prevent spam (e.g. 3 updates from same shop)
    const groupSpamNotifications = (notificationsList) => {
        const grouped = [];
        const seenGroups = {};

        notificationsList.forEach(notif => {
            if (notif.shopName) {
                const key = `${notif.shopName}_${notif.type}`;
                if (seenGroups[key]) {
                    seenGroups[key].items.push(notif);
                } else {
                    seenGroups[key] = {
                        isGroup: true,
                        _id: notif._id,
                        type: notif.type,
                        title: notif.title,
                        shopName: notif.shopName,
                        priority: notif.priority,
                        createdAt: notif.createdAt,
                        isRead: notif.isRead,
                        actionUrl: notif.actionUrl,
                        actionText: notif.actionText,
                        items: [notif]
                    };
                    grouped.push(seenGroups[key]);
                }
            } else {
                grouped.push(notif);
            }
        });

        return grouped;
    };

    // Category and Time Filter/Group processing
    const filteredAndGrouped = useMemo(() => {
        let list = allNotifications;
        if (activeFilter !== 'ALL') {
            list = list.filter(n => n.type === activeFilter);
        }

        const antiSpamList = groupSpamNotifications(list);

        const groups = {
            'Today': [],
            'Yesterday': [],
            'Older': []
        };

        const todayStr = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        antiSpamList.forEach(n => {
            const date = new Date(n.createdAt);
            const dateStr = date.toDateString();

            if (dateStr === todayStr) {
                groups['Today'].push(n);
            } else if (dateStr === yesterdayStr) {
                groups['Yesterday'].push(n);
            } else {
                groups['Older'].push(n);
            }
        });

        const finalGroups = {};
        Object.entries(groups).forEach(([label, items]) => {
            if (items.length > 0) {
                finalGroups[label] = items;
            }
        });

        return finalGroups;
    }, [allNotifications, activeFilter]);

    // Unread count indicators
    const unreadCount = useMemo(() => {
        return allNotifications.filter(n => !n.isRead).length;
    }, [allNotifications]);

    const filterCounts = useMemo(() => {
        const counts = {
            ALL: 0,
            BUSINESSES: 0,
            SERVICES: 0,
            BOOKINGS: 0,
            CREATORS: 0,
            UPDATES: 0
        };
        allNotifications.forEach(n => {
            if (!n.isRead) {
                counts.ALL++;
                if (counts[n.type] !== undefined) {
                    counts[n.type]++;
                }
            }
        });
        return counts;
    }, [allNotifications]);

    // Priority color accents
    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'high': return 'border-l-[5px] border-[#E07A5F] bg-orange-50/20';
            case 'medium': return 'border-l-[5px] border-blue-500 bg-blue-50/10';
            case 'low': return 'border-l-[5px] border-gray-400 bg-gray-50/30';
            default: return 'border-l-[5px] border-gray-300';
        }
    };

    // Nice human-like timestamps
    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24 && date.toDateString() === now.toDateString()) {
            return `Today • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-black/10 border-t-[#E07A5F] rounded-full animate-spin"></div>
                <p className="text-gray-450 font-bold uppercase tracking-widest text-[10px]">Loading Notification Feed...</p>
            </div>
        </div>
    );

    return (
        <div className="bg-transparent pt-2 pb-16 font-sans">
            <div className="max-w-[1400px] w-[92%] mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150/40 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#E07A5F] hover:border-[#E07A5F]/40 transition-all active:scale-95 cursor-pointer shadow-xs"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-baseline gap-3">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="text-sm font-bold text-white bg-[#E07A5F] px-2.5 py-0.5 rounded-full shadow-sm">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-500 text-xs font-medium mt-1">Keep track of updates, bookings, and location discoveries around you.</p>
                        </div>
                    </div>
                    
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAll}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-[#E07A5F] hover:shadow-lg transition-all uppercase tracking-wider cursor-pointer"
                        >
                            <Check size={14} /> Mark all read
                        </button>
                    )}
                </div>

                {/* Categories Filter Tabs */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 scrollbar-hide border-b border-gray-100/50">
                    {['ALL', 'BUSINESSES', 'SERVICES', 'BOOKINGS', 'CREATORS', 'UPDATES'].map(f => {
                        const count = filterCounts[f];
                        return (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all shadow-xs border flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:-translate-y-0.5 ${activeFilter === f
                                    ? 'bg-[#E07A5F] text-white border-[#E07A5F] shadow-md shadow-[#E07A5F]/15'
                                    : 'bg-white text-gray-655 border-gray-200 hover:border-[#E07A5F]/30 hover:text-[#E07A5F]'
                                    }`}
                            >
                                <span>{f}</span>
                                {count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                        activeFilter === f ? 'bg-white text-[#E07A5F]' : 'bg-[#E07A5F] text-white'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Layout (Inbox Grid) */}
                <div className="space-y-10">
                    {Object.keys(filteredAndGrouped).length === 0 ? (
                        /* Redesigned Rich Empty State */
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto px-8">
                            <span className="text-4xl block mb-4">🎉</span>
                            <h3 className="text-gray-900 font-extrabold text-2xl tracking-tight">All caught up!</h3>
                            <p className="text-gray-500 font-semibold mt-3 text-sm max-w-sm mx-auto leading-relaxed">
                                We'll keep you notified about the local pulse:
                            </p>
                            
                            <ul className="text-left max-w-xs mx-auto my-6 space-y-3.5 text-xs text-gray-500 font-bold">
                                <li className="flex items-center gap-2.5">
                                    <span className="text-[#E07A5F] text-sm">🏪</span> New businesses join nearby
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="text-[#E07A5F] text-sm">📅</span> Bookings change status
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="text-[#E07A5F] text-sm">🛠️</span> Services become available
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="text-[#E07A5F] text-sm">❤️</span> Interested items get updated
                                </li>
                            </ul>

                            <div className="pt-2 flex gap-3 justify-center">
                                <button
                                    onClick={() => navigate('/shops')}
                                    className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-[#E07A5F] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
                                >
                                    Explore Businesses
                                </button>
                                <button
                                    onClick={() => navigate('/services')}
                                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-black uppercase tracking-wider transition-all shadow-sm transform hover:-translate-y-0.5 cursor-pointer"
                                >
                                    Explore Services
                                </button>
                            </div>
                        </div>
                    ) : (
                        Object.entries(filteredAndGrouped).map(([label, items]) => (
                            <div key={label} className="space-y-4">
                                {/* Time Group Headers */}
                                <div className="flex items-center gap-3 px-2">
                                    <Calendar className="text-gray-400 opacity-80 shrink-0" size={13} />
                                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</h2>
                                    <div className="flex-1 h-px bg-gray-200/60"></div>
                                </div>

                                {/* Inbox Cards List */}
                                <div className="grid gap-4.5 max-w-4xl">
                                    {items.map(notif => {
                                        const isGroup = notif.isGroup && notif.items.length > 1;
                                        const isExpanded = expandedGroups[notif._id];
                                        
                                        if (isGroup) {
                                            const unreadGroupCount = notif.items.filter(item => !item.isRead).length;
                                            return (
                                                <div
                                                    key={notif._id}
                                                    className={`group relative p-6 bg-white rounded-2xl border border-gray-150 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between ${getPriorityStyles(notif.priority)}`}
                                                    onClick={() => toggleExpandGroup(notif._id)}
                                                >
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-gray-800 tracking-tight">{notif.title}</span>
                                                                {unreadGroupCount > 0 && (
                                                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#E07A5F] text-white rounded-full">
                                                                        {unreadGroupCount} New
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black text-gray-900 uppercase tracking-wide">
                                                                    {notif.shopName}
                                                                </p>
                                                                <p className="text-sm text-gray-650 font-semibold leading-relaxed">
                                                                    Made {notif.items.length} updates today
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded border border-gray-100/60">
                                                            {formatTime(notif.createdAt)}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-gray-100/60 flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-gray-405 uppercase tracking-widest">
                                                            Grouped Alerts
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all shadow-sm cursor-pointer"
                                                        >
                                                            {isExpanded ? 'Collapse Updates ▲' : `View ${notif.items.length} Updates ▼`}
                                                        </button>
                                                    </div>

                                                    {/* Expanded grouped child items */}
                                                    {isExpanded && (
                                                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                                                            {notif.items.map(child => (
                                                                <div
                                                                    key={child._id}
                                                                    className={`p-4 bg-gray-55/40 rounded-xl border border-gray-100/60 relative transition-all hover:bg-gray-50 ${
                                                                        child.isRead ? 'opacity-80' : 'border-l-2 border-l-[#E07A5F] bg-orange-50/15'
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (child.actionUrl) navigate(child.actionUrl);
                                                                        if (!child.isRead) handleMarkRead(child._id);
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between items-baseline mb-1">
                                                                        <span className="text-xs font-extrabold text-gray-800">{child.message}</span>
                                                                        <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">{formatTime(child.createdAt)}</span>
                                                                    </div>
                                                                    {child.details && (
                                                                        <p className="text-[11px] text-gray-450 font-semibold">{child.details}</p>
                                                                    )}
                                                                    {!child.isRead && (
                                                                        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#E07A5F]"></span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // Standard Single Item Card
                                        return (
                                            <div
                                                key={notif._id}
                                                className={`group relative p-6 bg-white rounded-2xl border border-gray-150 transition-all hover:shadow-md hover:-translate-y-[2px] cursor-pointer flex flex-col justify-between ${getPriorityStyles(notif.priority)} ${
                                                    notif.isRead ? 'opacity-85' : 'shadow-sm'
                                                }`}
                                                onClick={() => {
                                                    if (notif.actionUrl) navigate(notif.actionUrl);
                                                    if (!notif.isRead) handleMarkRead(notif._id);
                                                }}
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-800 tracking-tight">{notif.title}</span>
                                                            {!notif.isRead && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F] animate-pulse"></span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="space-y-1">
                                                            {notif.shopName && (
                                                                <p className="text-xs font-black text-gray-900 uppercase tracking-wide">
                                                                    {notif.shopName}
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-gray-655 font-semibold leading-relaxed">
                                                                {notif.message}
                                                            </p>
                                                            {notif.details && (
                                                                <p className="text-xs text-gray-450 font-medium italic mt-1 bg-gray-50/50 p-1.5 rounded border border-gray-100/60 inline-block">
                                                                    {notif.details}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded border border-gray-100/60">
                                                        {formatTime(notif.createdAt)}
                                                    </span>
                                                </div>

                                                {notif.actionUrl && (
                                                    <div className="mt-4 pt-3 border-t border-gray-50/50 flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-gray-405 uppercase tracking-widest">
                                                            Action Required
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!notif.isRead) handleMarkRead(notif._id);
                                                                navigate(notif.actionUrl);
                                                            }}
                                                            className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-[#E07A5F] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 cursor-pointer"
                                                        >
                                                            {notif.actionText || 'View Details'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
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
