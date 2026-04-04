import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const DisputeModal = ({ order, onSuccess, onClose }) => {
    const { user } = useAuth();
    const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter only valid items
    const orderItems = order.items || [];

    const handleToggleItem = (itemId) => {
        setSelectedItems(prev => {
            const newState = { ...prev };
            if (newState[itemId]) {
                delete newState[itemId];
            } else {
                newState[itemId] = 1; // Default to 1 qty
            }
            return newState;
        });
    };

    const handleQuantityChange = (itemId, qty) => {
        if (qty < 1) return;
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: qty
        }));
    };

    const handleSubmit = async () => {
        if (Object.keys(selectedItems).length === 0) return;

        setIsSubmitting(true);
        try {
            const itemsToDispute = Object.keys(selectedItems).map(itemId => {
                const item = orderItems.find(i => i.product._id === itemId || i.product === itemId);
                return {
                    product: itemId,
                    quantity: selectedItems[itemId],
                    reason: 'Item unavailable at shop'
                };
            });

            await axios.post(`/api/customer/orders/${order._id}/dispute`, {
                items: itemsToDispute,
                note
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Dispute failed", error);
            alert("Failed to submitting dispute. Please try again.");
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* ... existing dispute form content ... */}
                <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                            <FaExclamationCircle />
                        </div>
                        <h3 className="font-bold text-rose-900">Item Unavailable?</h3>
                    </div>
                    <button onClick={onClose} className="text-rose-300 hover:text-rose-700 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-stone-500 mb-4">
                        Select the items that were not available during your visit. We will process an instant refund/adjustment.
                    </p>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
                        {orderItems.map((item) => {
                            const itemId = item.product._id || item.product;
                            const isSelected = !!selectedItems[itemId];

                            return (
                                <div
                                    key={itemId}
                                    onClick={() => handleToggleItem(itemId)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-rose-500 bg-rose-50' : 'border-stone-100 hover:border-stone-200'}`}
                                >
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-stone-300'}`}>
                                        {isSelected && <FaTimes size={12} />}
                                    </div>
                                    <img src={item.image || item.product?.image} alt="" className="w-10 h-10 rounded-lg bg-stone-100 object-cover" />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-stone-800 line-clamp-1">{item.name}</p>
                                        <p className="text-xs text-stone-400">Ordered: {item.quantity}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <textarea
                        placeholder="Optional note (e.g. 'Shopkeeper said out of stock')"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none h-20 mb-4"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-sm font-bold text-stone-500 bg-stone-100 rounded-xl hover:bg-stone-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || Object.keys(selectedItems).length === 0}
                            className="flex-1 py-3 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-200"
                        >
                            {isSubmitting ? 'Processing...' : 'Submit Dispute'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DisputeModal;
