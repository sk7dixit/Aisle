import { createContext, useContext, useState, useEffect } from "react";
import { createNotification } from "../api/notificationApi";

const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
    // Load initial state from localStorage
    const [activities, setActivities] = useState(() => {
        const saved = localStorage.getItem("shoplens_activities");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map(a => ({
                    ...a,
                    createdAt: new Date(a.createdAt)
                }));
            } catch (e) {
                console.error("Error parsing activities", e);
                return [];
            }
        }
        return [];
    });

    const [trustScore, setTrustScore] = useState(() => {
        const saved = localStorage.getItem("shoplens_trustScore");
        return saved ? Number(saved) : 100;
    });

    const [missedCount, setMissedCount] = useState(() => {
        const saved = localStorage.getItem("shoplens_missedCount");
        return saved ? Number(saved) : 0;
    });

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem("shoplens_activities", JSON.stringify(activities));
    }, [activities]);

    useEffect(() => {
        localStorage.setItem("shoplens_trustScore", trustScore.toString());
    }, [trustScore]);

    useEffect(() => {
        localStorage.setItem("shoplens_missedCount", missedCount.toString());
    }, [missedCount]);

    // --- Helper: Generate Visit Identification ---
    const generateVisitId = () => "VST-" + Math.floor(100000 + Math.random() * 900000);

    const addActivity = (activity) => {
        const enrichedActivity = {
            id: Date.now(),
            createdAt: new Date(),
            ...activity
        };

        // If it's a visit, ensure it has a visitId
        if (activity.type === 'VISIT' && !activity.visitId) {
            enrichedActivity.visitId = generateVisitId();
        }

        setActivities((prev) => [enrichedActivity, ...prev]);

        // TRIGGER NOTIFICATION: Scheduled
        if (activity.type === 'VISIT') {
            createNotification({
                type: 'SYSTEM',
                title: 'Visit Scheduled',
                message: `Your visit to ${activity.shopName} is scheduled for ${activity.visitDate} at ${activity.visitStartTime}.`,
                actionUrl: '/activity'
            });
        }
    };

    const removeActivity = (id) => {
        setActivities((prev) => prev.filter(a => a.id !== id));
    };

    /**
     * updateActivityStatus
     * Updates the status of an activity and handles trust score logic accordingly.
     */
    const updateActivityStatus = (id, newStatus) => {
        setActivities((prev) => {
            const index = prev.findIndex(a => a.id === id);
            if (index === -1) return prev;

            const activity = prev[index];
            const oldStatus = activity.status;

            if (oldStatus === newStatus) return prev;

            const updatedActivities = [...prev];
            updatedActivities[index] = { ...activity, status: newStatus };

            // Trust Score & Miss logic
            if (newStatus === 'MISSED' || newStatus === 'EXPIRED') {
                setMissedCount(currentCount => {
                    const nextCount = currentCount + 1;
                    if (nextCount === 1) {
                        // First missed visit: Goodwill grace period
                    } else if (nextCount === 2) {
                        setTrustScore(s => Math.max(0, s - 20));
                    } else {
                        setTrustScore(s => Math.max(0, s - 30));
                    }
                    return nextCount;
                });
            } else if (newStatus === 'COMPLETED') {
                if (activity.type === 'VISIT') {
                    setTrustScore(s => Math.min(100, s + 10));
                } else {
                    setTrustScore(s => Math.min(100, s + 5));
                }
            }

            // TRIGGER NOTIFICATION: Status Change
            const behavior = {
                'VISITED': { type: 'SELLER', title: 'Visit Acknowledged', message: `Seller at ${activity.shopName} has confirmed your arrival!`, url: '/activity' },
                'COMPLETED': { type: 'SELLER', title: 'Visit Completed', message: `Thanks for visiting ${activity.shopName}. Your visit has been marked as complete.`, url: '/activity' },
                'MISSED': { type: 'SYSTEM', title: 'Visit Missed', message: `You missed your scheduled visit to ${activity.shopName}. Multiple misses may affect your trust score.`, url: '/activity' }
            };

            if (behavior[newStatus]) {
                createNotification({
                    type: behavior[newStatus].type,
                    title: behavior[newStatus].title,
                    message: behavior[newStatus].message,
                    actionUrl: behavior[newStatus].url
                });
            }

            return updatedActivities;
        });
    };

    // --- Auto-Expiry Logic (Precise Check) ---
    // --- Auto-Expiry Logic (Precise Check) ---
    const checkVisitExpiry = (visit) => {
        // Check for all "active" statuses
        const activeStatuses = ['UPCOMING', 'READY', 'pending', 'confirmed'];
        if (!activeStatuses.includes(visit.status) || !visit.visitDate || !visit.visitEndTime) return visit;

        const now = new Date();
        const GRACE = 15 * 60 * 1000; // 15 minutes grace period

        try {
            // Ensure proper date string format for parsing (YYYY-MM-DDTHH:mm)
            // If visitDate contains time or is ISO, we might need adjustment, but assuming YYYY-MM-DD
            const dateTimeStr = `${visit.visitDate}T${visit.visitEndTime}`;
            const visitEndDateTime = new Date(dateTimeStr);

            // Check if date is valid
            if (isNaN(visitEndDateTime.getTime())) {
                console.warn("Invalid date format for expiry check:", dateTimeStr, visit);
                return visit;
            }

            if (now.getTime() > visitEndDateTime.getTime() + GRACE) {
                console.log(`Visit expired: ${visit.shopName} (Scheduled: ${visitEndDateTime.toLocaleTimeString()})`);
                return {
                    ...visit,
                    status: 'EXPIRED',
                    expiredAt: now.toISOString()
                };
            }
        } catch (e) {
            console.error("Date parsing error in expiry check", e);
        }
        return visit;
    };

    useEffect(() => {
        const checkExpirations = () => {
            setActivities(prev => {
                let changed = false;
                const updated = prev.map(visit => {
                    const checked = checkVisitExpiry(visit);

                    if (checked.status === 'EXPIRED' && visit.status !== 'EXPIRED') {
                        changed = true;
                        // Trigger Missed Count increase for auto-expiry
                        setMissedCount(current => {
                            const nextCount = current + 1;
                            if (nextCount === 2) {
                                setTrustScore(s => Math.max(0, s - 20));
                            } else if (nextCount > 2) {
                                setTrustScore(s => Math.max(0, s - 30));
                            }
                            return nextCount;
                        });

                        // TRIGGER NOTIFICATION: Expiry
                        createNotification({
                            type: 'SYSTEM',
                            title: 'Visit Expired',
                            message: `Your visit to ${visit.shopName} has expired as the scheduled time passed.`,
                            actionUrl: '/activity'
                        });

                        return checked;
                    }
                    return checked;
                });
                return changed ? updated : prev;
            });
        };

        const interval = setInterval(checkExpirations, 30000); // Check every 30 seconds
        checkExpirations();
        return () => clearInterval(interval);
    }, []);

    const hasActiveVisit = (shopId) => {
        return activities.some(a =>
            a.shopId === shopId &&
            a.type === 'VISIT' &&
            (a.status === 'UPCOMING' || a.status === 'VISITED')
        );
    };

    return (
        <ActivityContext.Provider value={{
            activities,
            addActivity,
            removeActivity,
            updateActivityStatus,
            trustScore,
            missedCount,
            generateVisitId,
            hasActiveVisit
        }}>
            {children}
        </ActivityContext.Provider>
    );
};

export const useActivity = () => useContext(ActivityContext);
