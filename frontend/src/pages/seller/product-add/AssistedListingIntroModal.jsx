import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheckCircle, FaUpload, FaPhoneAlt, FaHandshake } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';

const AssistedListingIntroModal = ({ isOpen, onClose, onContinue }) => {
    const { user } = useAuth();
    const isPro = user?.subscription?.planId !== 'free';

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                                    <FaHandshake />
                                </div>
                                <h2 className="text-xl font-black text-slate-900">Assisted Listing</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <FaTimes className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">We'll list products on your behalf</h3>
                                <p className="text-slate-500 font-medium">Focus on your business, let us handle the inventory.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                        <FaCheckCircle size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">₹1 per product</h4>
                                        <p className="text-xs text-slate-500">Transparent pricing with no hidden charges.</p>
                                        {isPro && (
                                            <div className="mt-1 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase">
                                                Included with Pro Subscription
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                                        <FaUpload size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Share Photos or Lists</h4>
                                        <p className="text-xs text-slate-500">Upload images of your shelves or a product list.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                        <FaPhoneAlt size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Team Contact</h4>
                                        <p className="text-xs text-slate-500">Our team will call you to finalize details.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onContinue}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Continue to Request
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AssistedListingIntroModal;
