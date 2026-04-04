import { createContext, useContext, useState } from "react";

const InterestedContext = createContext();

export const InterestedProvider = ({ children }) => {
    const [items, setItems] = useState([]);

    const updateQuantity = (item, delta) => {
        setItems((prev) => {
            const index = prev.findIndex(
                (p) => p.productId === item.productId && p.shopId === item.shopId
            );

            if (index === -1) {
                // Item not in list, add it if delta > 0
                if (delta > 0) {
                    return [...prev, { ...item, quantity: delta, addedAt: new Date() }];
                }
                return prev;
            }

            // Item exists, update quantity
            const currentItem = prev[index];
            const newQuantity = (currentItem.quantity || 0) + delta;

            if (newQuantity <= 0) {
                // Remove item
                return prev.filter((_, i) => i !== index);
            }

            // Update item
            const newItems = [...prev];
            newItems[index] = { ...currentItem, quantity: newQuantity };
            return newItems;
        });
    };

    const getQuantity = (shopId, productId) => {
        const item = items.find(i => i.shopId === shopId && i.productId === productId);
        return item ? item.quantity : 0;
    };

    const clearInterestedByShop = (shopId) => {
        setItems((prev) => prev.filter(item => item.shopId !== shopId));
    };

    return (
        <InterestedContext.Provider value={{ items, updateQuantity, getQuantity, clearInterestedByShop }}>
            {children}
        </InterestedContext.Provider>
    );
};

export const useInterested = () => useContext(InterestedContext);
