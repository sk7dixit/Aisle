import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchUnreadCount, fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { socket } from '../utils/socket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const openNotification = () => setIsNotificationOpen(true);
    const closeNotification = () => setIsNotificationOpen(false);

    const refreshData = useCallback(async () => {
        if (!user || user.role !== 'seller') return;

        try {
            // Fetch unread count first
            const count = await fetchUnreadCount();
            setUnreadCount(count);

            // Fetch latest notifications
            const data = await fetchNotifications(1, 5);
            setNotifications(data.notifications);
        } catch (error) {
            // console.warn('Notifications disabled temporarily');
            // Silent fail to filter noise
        }
    }, [user]);

    // 1. Initial Load & Polling Fallback
    useEffect(() => {
        // TEMPORARILY DISABLE
        setNotifications([]);
        setLoading(false);
        return;
    }, []);

    // 2. Real-time Socket Listener (DISABLED TEMPORARILY)
    useEffect(() => {
        // if (!user || user.role !== 'seller') return;

        // console.log("🔌 Connectivity: Initializing Socket for Seller...");
        // socket.connect();
        // socket.emit('seller:join', user._id);

        // const handleNewNotification = (newNotif) => { ... }
        // socket.on('notification:new', handleNewNotification);

        // return () => {
        //     socket.off('notification:new', handleNewNotification);
        //     socket.disconnect();
        // };
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await markNotificationRead(id);
            // Optimistic update
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('[NotificationContext] Failed to mark read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('[NotificationContext] Failed to mark all read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications,
            loading,
            isNotificationOpen,
            openNotification,
            closeNotification,
            refreshData,
            markAsRead,
            markAllRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
