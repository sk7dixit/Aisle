import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';

const AssistedListingSuccessModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const isPro = user?.subscription?.planId !== 'free';

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 text-center"
                    >
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto mb-6">
                            <FaCheckCircle />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-2">Request Received</h3>
                        <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                            Our team will contact you shortly to complete product listing.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-2xl mb-6 inline-block w-full">
                            {isPro ? (
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    This service is included with your Pro subscription
                                </p>
                            ) : (
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Charges will be ₹1 per product, finalized after review
                                </p>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black tracking-widest uppercase text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Back to Add Products
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AssistedListingSuccessModal;
