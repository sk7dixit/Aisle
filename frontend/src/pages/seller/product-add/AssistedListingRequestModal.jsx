import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheckCircle, FaUpload, FaPhoneAlt, FaMapMarkerAlt, FaUser, FaInfoCircle, FaHandshake, FaCamera, FaBoxOpen } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';

const AssistedListingRequestModal = ({ isOpen, onClose, onSuccess }) => {
    const { user, token } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState([]);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        mobile: user?.mobile || '',
        address: user?.shopDetails?.address || '',
        estimatedProductCount: ''
    });

    const isPro = user?.subscription?.planId !== 'free';

    useEffect(() => {
        if (isOpen) {
            setFiles([]);
            setFormData({
                name: user?.name || '',
                mobile: user?.mobile || '',
                address: user?.shopDetails?.address || '',
                estimatedProductCount: ''
            });
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleFileUpload = (e) => {
        const uploadedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...uploadedFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('mobile', formData.mobile);
            data.append('address', formData.address);
            if (formData.estimatedProductCount) {
                data.append('estimatedProductCount', formData.estimatedProductCount);
            }
            files.forEach(file => {
                data.append('files', file);
            });

            const res = await fetch('/api/seller/assisted-listing/request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (res.ok) {
                onSuccess();
            } else {
                let errorMessage = 'Failed to submit request';
                try {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await res.json();
                        errorMessage = errorData.message || errorMessage;
                    } else {
                        // If not JSON, it might be a server error page or text
                        const errorText = await res.text();
                        console.error('Non-JSON Error Response:', errorText);
                    }
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Submit Error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Request Assisted Listing</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Our team will contact you to complete listing</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <FaTimes className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar space-y-6">
                            {/* ... Content ... */}
                            {isPro && (
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                                        <FaCheckCircle />
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-800 font-bold text-sm">Included with Pro Subscription</h4>
                                        <p className="text-emerald-600 text-[10px] font-medium uppercase tracking-wider">Pro Benefit Applied</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-3 left-4">Seller Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pt-8 pb-3 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-slate-900 transition-all outline-none"
                                        placeholder="Your Name"
                                    />
                                    <FaUser className="absolute right-4 bottom-4 text-slate-300" />
                                </div>

                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-3 left-4">Mobile Number</label>
                                    <input
                                        type="text"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        className="w-full pt-8 pb-3 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-slate-900 transition-all outline-none"
                                        placeholder="Phone number for contact"
                                    />
                                    <FaPhoneAlt className="absolute right-4 bottom-4 text-slate-300" />
                                </div>

                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-3 left-4">Shop Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pt-8 pb-3 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-slate-900 transition-all outline-none min-h-[100px] resize-none"
                                        placeholder="Where should our team visit?"
                                    />
                                    <FaMapMarkerAlt className="absolute right-4 bottom-4 text-slate-300" />
                                </div>

                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-3 left-4">Est. Product Count (Optional)</label>
                                    <input
                                        type="number"
                                        value={formData.estimatedProductCount}
                                        onChange={(e) => setFormData({ ...formData, estimatedProductCount: e.target.value })}
                                        className="w-full pt-8 pb-3 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-slate-900 transition-all outline-none"
                                        placeholder="Approximate count"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium px-2 mt-1">Approximate count is okay</p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Share Product Data (Optional)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group">
                                            <FaCamera className="text-slate-400 group-hover:text-indigo-500 mb-2" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Upload Images</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group">
                                            <FaUpload className="text-slate-400 group-hover:text-emerald-500 mb-2" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Upload List</span>
                                            <input type="file" multiple accept=".pdf,.doc,.docx,.txt,image/*" className="hidden" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">“You can also share product details later when our team contacts you.”</p>
                                </div>

                                {files.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="relative group">
                                                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200">
                                                    {file.type.startsWith('image/') ? (
                                                        <img src={URL.createObjectURL(file)} alt="upload" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaBoxOpen className="text-slate-400 text-xl" />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm active:scale-90"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!isPro && (
                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                                    <FaInfoCircle className="text-slate-400" size={12} />
                                    <p className="text-[10px] text-slate-500 font-medium tracking-tight">₹1 per product • Final amount confirmed after review</p>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.name || !formData.mobile || !formData.address}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black tracking-widest uppercase text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSubmitting ? 'Submitting...' : 'Get in Touch'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AssistedListingRequestModal;

