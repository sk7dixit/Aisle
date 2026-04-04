import React, { createContext, useContext, useState, useEffect } from 'react';

const SavedContext = createContext();

export const SavedProvider = ({ children }) => {
    // Saved Items: [{ productId, shopId, shopName, productName, price, category, image, savedAt }]
    // Persist to localStorage for MVP
    const [savedItems, setSavedItems] = useState(() => {
        const local = localStorage.getItem('shoplens_saved_items');
        return local ? JSON.parse(local) : [];
    });

    useEffect(() => {
        localStorage.setItem('shoplens_saved_items', JSON.stringify(savedItems));
    }, [savedItems]);

    // Action: Save Item (Toggle)
    const toggleSave = (item) => {
        setSavedItems(prev => {
            const exists = prev.find(i => i.productId === item.productId && i.shopId === item.shopId);
            if (exists) {
                // Remove
                return prev.filter(i => !(i.productId === item.productId && i.shopId === item.shopId));
            } else {
                // Add
                return [...prev, { ...item, savedAt: Date.now() }];
            }
        });
    };

    // Action: Check if Saved
    const isSaved = (shopId, productId) => {
        return savedItems.some(i => i.productId === productId && i.shopId === shopId);
    };

    // Action: Remove specific item (used elsewhere if needed)
    const removeSavedItem = (shopId, productId) => {
        setSavedItems(prev => prev.filter(i => !(i.productId === productId && i.shopId === shopId)));
    };

    return (
        <SavedContext.Provider value={{ savedItems, toggleSave, isSaved, removeSavedItem }}>
            {children}
        </SavedContext.Provider>
    );
};

export const useSaved = () => {
    const context = useContext(SavedContext);
    if (!context) throw new Error("useSaved must be used within SavedProvider");
    return context;
};
