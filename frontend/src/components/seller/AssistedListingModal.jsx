import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaPhoneAlt, FaUser, FaMapMarkerAlt, FaSpinner, FaFileImage, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const AssistedListingModal = ({ isOpen, onClose }) => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [productCount, setProductCount] = useState('');
    const [images, setImages] = useState([]);

    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 3) {
            toast.error("Max 3 images allowed");
            return;
        }
        setImages([...images, ...files]);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleRequest = async () => {
        if (!productCount) {
            toast.error("Please enter an approximate product count.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('userId', user._id);
            formData.append('mobile', user.phone || user.email); // CORRECTED KEY: 'mobile' match Backend
            formData.append('estimatedProductCount', productCount); // CORRECTED KEY: match Backend
            formData.append('category', 'ASSISTED_LISTING');
            formData.append('summary', `Assisted Listing Request for ~${productCount} products`);

            // Address Logic Correction
            const userAddress = user.shopDetails?.address || user.shopDetails?.location?.address || 'Address not set';

            // Create logs object (optional, for metadata)
            const logs = {
                source: 'Seller Dashboard Modal',
                address: userAddress,
                estProducts: productCount
            };
            formData.append('logs', JSON.stringify(logs));

            // Append images
            images.forEach((image) => {
                formData.append('images', image);
            });

            // Submit to Request System (Assisted Listing)
            const res = await fetch('/api/requests/assisted-listing', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type is auto-set by browser for FormData
                },
                body: formData
            });

            if (res.ok) {
                toast.success('Request received! We will call you shortly.');
                onClose();
                setProductCount('');
                setImages([]);
                setStep(1); // Reset step
            } else {
                toast.error('Failed to submit request. Please try again.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Network error.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative max-h-[70vh] flex flex-col">
                {/* ... existing multi-step content ... */}
                {step === 1 && (
                    <>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
                                    <FaPhoneAlt size={14} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                                        Assisted Listing
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        We’ll list products on your behalf
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                                    <span className="font-bold">₹1</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">₹1 per product</h3>
                                    <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded uppercase mt-1">
                                        Included with Pro Subscription
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                                    <FaFileImage />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Share Photos or Lists</h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Upload shelf images or product list
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
                                    <FaPhoneAlt />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Team Contact</h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Our team will call to finalize details
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs transition-all hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                Continue to Request
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="p-1 -ml-2 mr-1 text-slate-400 hover:text-slate-600"
                                >
                                    <FaTimes className="rotate-45" />
                                </button>
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
                                    <FaPhoneAlt size={14} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                                        Request Assisted Listing
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Our team will contact you
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto no-scrollbar space-y-5 flex-1">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider">Seller Name</span>
                                    <div className="flex items-center gap-2 font-bold text-slate-700">
                                        {user.name} <FaUser className="text-slate-300" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-start text-xs border-t border-slate-100 pt-3">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider mt-0.5">Shop Address</span>
                                    <div className="flex items-start gap-2 font-bold text-slate-700 text-right max-w-[60%]">
                                        <span className="line-clamp-2">{user.shopDetails?.address || user.shopDetails?.shopLocation?.address || user.shopDetails?.location?.address || "Address not provided"}</span>
                                        <FaMapMarkerAlt className="text-slate-300 mt-0.5 flex-shrink-0" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                                    Mobile Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        disabled
                                        value={user.phone || "Not Set"}
                                        className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed"
                                    />
                                    <div className="absolute right-3 top-3 text-slate-400 text-xs font-medium">
                                        (Locked)
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
                                    Approx. number of products <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 120"
                                    value={productCount}
                                    onChange={(e) => setProductCount(e.target.value)}
                                    className="w-full bg-white p-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none text-slate-900 font-bold text-sm transition-colors"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                        Upload product photos (optional)
                                    </label>
                                    <span className="text-[9px] font-bold text-slate-300 uppercase">{images.length} / 3</span>
                                </div>

                                <div className="flex gap-3 overflow-x-auto pb-1">
                                    {images.length < 3 && (
                                        <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors flex-shrink-0">
                                            <FaFileImage className="text-slate-300 mb-1" />
                                            <span className="text-[9px] font-bold text-slate-400">ADD</span>
                                            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                                        </label>
                                    )}

                                    {images.map((img, idx) => (
                                        <div key={idx} className="w-20 h-20 relative rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 group">
                                            <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                            <button
                                onClick={handleRequest}
                                disabled={loading || !productCount}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <FaSpinner className="animate-spin" />}
                                Confirm Request
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default AssistedListingModal;
