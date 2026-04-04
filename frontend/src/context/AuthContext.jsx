import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUserStatus = async () => {
        console.log("AuthProvider: Checking user status");
        try {
            const storedUser = localStorage.getItem('shoplensUser');
            console.log("AuthProvider: storedUser", storedUser);
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.token) {
                    try {
                        // Fetch latest profile to sync verification status
                        const res = await fetch('/api/auth/profile', {
                            headers: { Authorization: `Bearer ${parsedUser.token}` }
                        });
                        if (res.ok) {
                            const freshUser = await res.json();
                            let extraData = {};

                            // NEW: Fetch Subscription Status for Sellers
                            if (freshUser.role === 'seller') {
                                try {
                                    const subRes = await fetch('/api/seller/subscription-status', {
                                        headers: { Authorization: `Bearer ${parsedUser.token}` }
                                    });
                                    if (subRes.ok) {
                                        const subData = await subRes.json();
                                        extraData.subscriptionStatus = subData;
                                    }
                                } catch (err) {
                                    console.warn("Sub fetch error", err);
                                }
                            }

                            const updatedData = { ...parsedUser, ...freshUser, ...extraData };
                            setUser(updatedData);
                            localStorage.setItem('shoplensUser', JSON.stringify(updatedData));
                        } else if (res.status === 401 || res.status === 403) {
                            // If token invalid or expired, clear the session
                            console.warn("AuthProvider: Session expired or invalid, logging out");
                            logout();
                        } else {
                            const errorData = await res.json().catch(() => ({}));
                            console.error("Failed to refresh profile - Status:", res.status, "Error:", errorData);
                            setUser(parsedUser);
                        }
                    } catch (e) {
                        console.error("Profile sync error details:", e);
                        setUser(parsedUser);
                    }
                } else {
                    setUser(parsedUser);
                }
            }
        } catch (error) {
            console.error("AuthProvider: Error in checkUserStatus", error);
        }
        console.log("AuthProvider: Setting loading to false");
        setLoading(false);
    };

    useEffect(() => {
        console.log("AuthProvider: Mounting");
        checkUserStatus();
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('shoplensUser', JSON.stringify(userData));
        localStorage.setItem('shoplensToken', userData.token);
    };

    const register = async (payload) => {
        try {
            // We assume axios is available or use fetch. Using fetch to avoid import churn if possible, but axios is better.
            // Let's rely on fetch since the file uses fetch in checkUserStatus. or just add import axios.
            // Using fetch to keep it dependency-light in this file if axios isn't already there?
            // Line 25 uses fetch.
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Registration failed');

            login(data);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('shoplensUser');
        localStorage.removeItem('shoplensToken');
        // Clear anything else that might have lingered
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
    };

    const value = {
        user,
        token: user?.token, // Explicitly expose token for components
        login,
        register,
        logout,
        checkUserStatus, // Added here
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
