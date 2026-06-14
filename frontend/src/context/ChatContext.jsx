import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { socket } from '../utils/socket';

const ChatContext = createContext();

const API_URL = '/api/chat';

// Helper to get auth header
const getAuthHeader = () => {
    const userStr = localStorage.getItem('aisleUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Use ref to keep active conversation id available in socket event listener closures
    const activeConversationRef = useRef(null);
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    // Fetch all conversations for the user
    const fetchConversations = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/conversations`, {
                headers: getAuthHeader()
            });
            setConversations(data);
        } catch (error) {
            console.error('[ChatContext] Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Get total unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await axios.get(`${API_URL}/unread-count`, {
                headers: getAuthHeader()
            });
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('[ChatContext] Failed to fetch unread count:', error);
        }
    }, [user]);

    // Get messages for active conversation
    const fetchMessages = useCallback(async (conversationId) => {
        if (!user || !conversationId) return;
        try {
            const { data } = await axios.get(`${API_URL}/conversations/${conversationId}/messages`, {
                headers: getAuthHeader()
            });
            setMessages(data);
        } catch (error) {
            console.error('[ChatContext] Failed to fetch messages:', error);
        }
    }, [user]);

    // Mark conversation messages as read
    const markAsRead = useCallback(async (conversationId) => {
        if (!user || !conversationId) return;
        try {
            await axios.put(`${API_URL}/conversations/${conversationId}/read`, {}, {
                headers: getAuthHeader()
            });
            
            // Update unread badge count locally
            setConversations(prev =>
                prev.map(c =>
                    c._id === conversationId ? { ...c, unreadCount: 0 } : c
                )
            );
            fetchUnreadCount();
        } catch (error) {
            console.error('[ChatContext] Failed to mark messages as read:', error);
        }
    }, [user, fetchUnreadCount]);

    // Select a conversation and join its socket room
    const selectConversation = useCallback(async (conversation) => {
        if (activeConversationRef.current) {
            // Leave old conversation room
            socket.emit('conversation:leave', activeConversationRef.current._id);
        }
        
        setActiveConversation(conversation);
        if (conversation) {
            // Join new conversation room
            socket.emit('conversation:join', conversation._id);
            await fetchMessages(conversation._id);
            await markAsRead(conversation._id);
        } else {
            setMessages([]);
        }
    }, [fetchMessages, markAsRead]);

    // Start a new conversation or open an existing one
    const startConversation = useCallback(async (participantId, type = 'business', referenceId = null) => {
        if (!user) return null;
        try {
            const { data } = await axios.post(`${API_URL}/conversations`, {
                participantId,
                type,
                referenceId
            }, {
                headers: getAuthHeader()
            });

            // Update conversations list state
            setConversations(prev => {
                const exists = prev.some(c => c._id === data._id);
                if (exists) {
                    return prev.map(c => c._id === data._id ? data : c);
                }
                return [data, ...prev];
            });

            await selectConversation(data);
            return data;
        } catch (error) {
            console.error('[ChatContext] Failed to start conversation:', error);
            return null;
        }
    }, [user, selectConversation]);

    // Send a message in active conversation
    const sendMessage = useCallback(async (text, attachments = []) => {
        const active = activeConversationRef.current;
        if (!user || !active || !text.trim()) return null;
        
        try {
            const { data } = await axios.post(`${API_URL}/messages`, {
                conversationId: active._id,
                text,
                attachments
            }, {
                headers: getAuthHeader()
            });

            // Append message locally (optimistic/socket sync backup)
            setMessages(prev => {
                const exists = prev.some(m => m._id === data._id);
                if (exists) return prev;
                return [...prev, data];
            });

            // Update local conversation snippet
            setConversations(prev =>
                prev.map(c =>
                    c._id === active._id
                        ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
                        : c
                ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
            );

            return data;
        } catch (error) {
            console.error('[ChatContext] Failed to send message:', error);
            return null;
        }
    }, [user]);

    // --- SOCKET INTEGRATION ---
    useEffect(() => {
        if (!user) {
            socket.disconnect();
            return;
        }

        // Establish Socket Connection
        socket.connect();
        socket.emit('user:join', user._id);

        // Handler for background notification (when a message comes in for any conversation)
        const handleReceivedNotify = (data) => {
            const active = activeConversationRef.current;
            const isForActiveChat = active && active._id === data.conversationId;

            // Update unread count if not active chat
            if (!isForActiveChat) {
                setUnreadCount(prev => prev + 1);
                setConversations(prev => {
                    const exists = prev.some(c => c._id === data.conversationId);
                    if (exists) {
                        return prev.map(c =>
                            c._id === data.conversationId
                                ? {
                                      ...c,
                                      lastMessage: data.message.text,
                                      lastMessageAt: data.message.createdAt,
                                      unreadCount: (c.unreadCount || 0) + 1
                                  }
                                : c
                        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
                    } else {
                        // Re-fetch conversations list to include new conversation
                        fetchConversations();
                        return prev;
                    }
                });
            }
        };

        // Handler for messages inside the active conversation room
        const handleReceivedMessage = (message) => {
            const active = activeConversationRef.current;
            if (active && active._id === message.conversationId) {
                setMessages(prev => {
                    const exists = prev.some(m => m._id === message._id);
                    if (exists) return prev;
                    return [...prev, message];
                });
                // Auto mark as read in DB and trigger unread recalculations
                markAsRead(active._id);
            }
        };

        // Handler for when the other participant reads messages
        const handleMessagesRead = ({ conversationId }) => {
            setMessages(prev =>
                prev.map(m =>
                    m.conversationId === conversationId ? { ...m, read: true } : m
                )
            );
        };

        // Register listeners
        socket.on('message:received_notify', handleReceivedNotify);
        socket.on('message:received', handleReceivedMessage);
        socket.on('messages:read', handleMessagesRead);

        // Initial fetch
        fetchConversations();
        fetchUnreadCount();

        return () => {
            socket.off('message:received_notify', handleReceivedNotify);
            socket.off('message:received', handleReceivedMessage);
            socket.off('messages:read', handleMessagesRead);
            socket.disconnect();
        };
    }, [user, fetchConversations, fetchUnreadCount, markAsRead]);

    return (
        <ChatContext.Provider
            value={{
                conversations,
                activeConversation,
                messages,
                unreadCount,
                loading,
                fetchConversations,
                selectConversation,
                startConversation,
                sendMessage,
                markConversationRead: markAsRead,
                fetchUnreadCount
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
