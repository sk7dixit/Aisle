import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SidebarStateContext = createContext();

export const useSidebarState = () => {
    return useContext(SidebarStateContext);
};

export const SidebarProvider = ({ children }) => {
    const { user } = useAuth();

    // Inputs (Signals) - Mapped to "Customer Page Context"
    const [userState, setUserState] = useState('first_visit'); // first_visit, browsing, searching, item_focused
    const [pageType, setPageType] = useState('landing'); // landing, market, profile, item
    const [searchQuery, setSearchQuery] = useState('');
    const [inferredIntent, setInferredIntent] = useState(null); // null, weak, strong
    const [confidenceScore, setConfidenceScore] = useState(0.0);
    const [openShopsCount, setOpenShopsCount] = useState(0);
    const [exactMatchAvailable, setExactMatchAvailable] = useState(false);

    // Update User State based on Auth
    useEffect(() => {
        if (user && userState === 'first_visit') {
            // Context initialization if needed
        }
    }, [user]);

    // ------------------------------------------------------------------
    // CORE LOGIC: Signal Management (Data Quality for UI)
    // ------------------------------------------------------------------

    // Public Actions to Signal State Changes
    const signalSearch = (query) => {
        setSearchQuery(query);
        setUserState('searching');
        setConfidenceScore(0.6); // Simulaton: Good query = good confidence
        setExactMatchAvailable(false);
    };

    const signalItemClick = (item) => {
        setUserState('item_focused');
        setExactMatchAvailable(true);
    };

    const signalBrowsing = (intent = 'weak') => {
        setUserState('browsing');
        setInferredIntent(intent);
        setSearchQuery('');
    };

    const updateSignals = (signals) => {
        if (signals.openShopsCount !== undefined) setOpenShopsCount(signals.openShopsCount);
        if (signals.confidenceScore !== undefined) setConfidenceScore(signals.confidenceScore);
        if (signals.exactMatchAvailable !== undefined) setExactMatchAvailable(signals.exactMatchAvailable);
        if (signals.pageType !== undefined) setPageType(signals.pageType);
    };

    return (
        <SidebarStateContext.Provider value={{
            // Signals (Read-only for UI)
            inputSignals: {
                userState,
                searchQuery,
                inferredIntent,
                confidenceScore,
                openShopsCount,
                pageType
            },
            // Actions
            signalSearch,
            signalItemClick,
            signalBrowsing,
            updateSignals
        }}>
            {children}
        </SidebarStateContext.Provider>
    );
};
