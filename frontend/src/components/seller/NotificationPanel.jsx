import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import {
    FaTimes, FaBell, FaCheck, FaInfoCircle, FaBoxOpen, FaClipboardList, FaStar, FaCheckDouble
} from 'react-icons/fa';

/**
 * SHOPLENS NOTIFICATION PANEL (Global Drawer)
 * Features:
 * 1. Controlled by NotificationContext
 * 2. Unread badge logic from Global State
 * 3. Mark as read
 * 4. Filter by type (Visual icons)
 */

const NotificationPanel = () => {
    const {
        notifications,
        loading,
        isNotificationOpen,
        closeNotification,
        markAsRead,
        markAllRead,
        unreadCount
    } = useNotifications();

    // ESC Key Listener
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') closeNotification();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [closeNotification]);

    if (!isNotificationOpen) return null;

    // Helper: Get Icon
    const getIcon = (type) => {
        switch (type) {
            case 'system': return <FaInfoCircle className="text-blue-500" />;
            case 'announcement': return <FaBell className="text-indigo-500 font-bold" />;
            case 'inventory': return <FaBoxOpen className="text-rose-500" />;
            case 'sales': return <FaClipboardList className="text-emerald-500" />;
            case 'feedback': return <FaStar className="text-amber-500" />;
            case 'reminder': return <FaCheck className="text-purple-500" />;
            default: return <FaBell className="text-slate-400" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end p-0 md:p-4 pointer-events-none">
            <div className="absolute inset-0 dashboard-overlay pointer-events-auto" onClick={closeNotification}></div>
            <div className="relative w-full max-w-sm bg-white h-full md:h-[calc(100vh-2rem)] shadow-2xl flex flex-col animate-slide-in-right pointer-events-auto md:rounded-[2rem] overflow-hidden">

                {/* Header (Lighter & Cleaner than Support) */}
                <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center z-10">
                    <div>
                        <h2 className="font-black text-xl text-slate-800 tracking-tight">Notifications</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Updates for your shop</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Mark All Read */}
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                title="Mark all as read"
                            >
                                <FaCheckDouble size={12} />
                            </button>
                        )}
                        <button onClick={closeNotification} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-0 bg-slate-50 custom-scrollbar">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-10 flex flex-col items-center text-center text-slate-400">
                            <FaBell className="text-4xl mb-3 opacity-20" />
                            <p className="text-sm font-medium">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    onClick={() => markAsRead(notif._id)}
                                    className={`
                                        p-4 hover:bg-white transition-colors cursor-pointer relative group
                                        ${notif.isRead ? 'bg-slate-50 opacity-60' : 'bg-white border-l-4 border-indigo-500'}
                                    `}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 text-lg">
                                            {getIcon(notif.type.toLowerCase())}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm ${notif.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-800'}`}>
                                                {notif.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">{notif.message}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">
                                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
