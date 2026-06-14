import axios from 'axios';

const API_URL = '/api/seller/notifications';

// Helper to get auth header (token can change, so we get it fresh)
const getAuthHeader = () => {
    const userStr = localStorage.getItem('aisleUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

// Fetch notifications (paginated)
export const fetchNotifications = async (page = 1, limit = 20) => {
    try {
        const { data } = await axios.get(`${API_URL}?page=${page}&limit=${limit}`, {
            headers: getAuthHeader()
        });
        return data;
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        throw error;
    }
};

// Get unread count
export const fetchUnreadCount = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/unread-count`, {
            headers: getAuthHeader()
        });
        return data.count;
    } catch (error) {
        console.error("Failed to fetch unread count:", error);
        return 0;
    }
};

// Mark as read
export const markNotificationRead = async (id) => {
    try {
        await axios.put(`${API_URL}/${id}/read`, {}, {
            headers: getAuthHeader()
        });
    } catch (error) {
        console.error("Failed to mark notification read:", error);
    }
};

// Mark all as read
export const markAllNotificationsRead = async () => {
    try {
        await axios.put(`${API_URL}/read-all`, {}, {
            headers: getAuthHeader()
        });
    } catch (error) {
        console.error("Failed to mark all read:", error);
    }
};

// Create notification (transactional)
export const createNotification = async (payload) => {
    try {
        const { data } = await axios.post(API_URL, payload, {
            headers: getAuthHeader()
        });
        return data;
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};

// --- Admin / Config API (Placeholders for NotificationCenter) ---

export const getNotificationConfig = async () => {
    // Return mock config or Implement real API call if backend ready
    return {
        channels: { email: true, inApp: true, push: false },
        events: {
            new_request: { channels: ['email', 'inApp'], priority: 'critical', delay: 'instant' },
            low_stock: { channels: ['inApp'], priority: 'important', delay: 'instant' },
            system_alert: { channels: ['inApp'], priority: 'normal', delay: 'instant' }
        }
    };
};

export const updateNotificationConfig = async (config) => {
    console.log("Updating config:", config);
    return { success: true };
};

export const getNotificationLogs = async () => {
    return []; // Return empty logs for now
};

export const triggerTestNotification = async (event) => {
    console.log("Triggering test:", event);
    return { success: true };
};
