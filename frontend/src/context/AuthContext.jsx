import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
            const storedUser = localStorage.getItem('aisleUser');
            console.log("AuthProvider: storedUser", storedUser);
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.token) {
                    try {
                        // Fetch latest profile to sync verification status
                        const res = await axios.get('/api/auth/profile');
                        const freshUser = res.data;
                        let extraData = {};

                        // NEW: Fetch Subscription Status for Sellers
                        if (freshUser.role === 'seller') {
                            try {
                                const subRes = await axios.get('/api/seller/subscription-status');
                                extraData.subscriptionStatus = subRes.data;
                            } catch (err) {
                                console.warn("Sub fetch error", err);
                            }
                        }

                        const updatedData = { ...parsedUser, ...freshUser, ...extraData };
                        setUser(updatedData);
                        localStorage.setItem('aisleUser', JSON.stringify(updatedData));
                    } catch (e) {
                        if (e.response?.status === 401 || e.response?.status === 403) {
                            console.warn("AuthProvider: Session expired or invalid, logging out");
                            logout();
                        } else {
                            console.error("Profile sync error details:", e);
                            setUser(parsedUser);
                        }
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
        localStorage.setItem('aisleUser', JSON.stringify(userData));
        localStorage.setItem('aisleToken', userData.token);
    };

    const register = async (payload) => {
        try {
            const response = await axios.post('/api/auth/register', payload);
            const data = response.data;
            login(data);
            return data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('aisleUser');
        localStorage.removeItem('aisleToken');
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
