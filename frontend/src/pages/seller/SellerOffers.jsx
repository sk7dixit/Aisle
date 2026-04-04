import React, { useState } from 'react';
import { FaTag, FaPlus, FaBan, FaTrash, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';

const SellerOffers = () => {
    const [offers, setOffers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        type: 'percentage',
        value: '',
        applicableTo: 'all',
        validFrom: '',
        validUntil: ''
    });

    const hasOffers = offers.length > 0;

    const openCreateModal = () => {
        setEditingOffer(null);
        setFormData({
            title: '',
            type: 'percentage',
            value: '',
            applicableTo: 'all',
            validFrom: '',
            validUntil: ''
        });
        setShowModal(true);
    };

    const openEditModal = (offer) => {
        setEditingOffer(offer);
        setFormData({
            title: offer.title,
            type: offer.type.toLowerCase(),
            value: offer.value,
            applicableTo: offer.match,
            validFrom: offer.validFrom || '',
            validUntil: offer.validUntil || ''
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newOffer = {
            id: editingOffer ? editingOffer.id : Date.now(),
            title: formData.title,
            type: formData.type === 'percentage' ? `${formData.value}% Off` : `₹${formData.value} Off`,
            value: formData.value,
            match: formData.applicableTo,
            status: 'Active',
            validFrom: formData.validFrom,
            validUntil: formData.validUntil
        };

        if (editingOffer) {
            setOffers(offers.map(o => o.id === editingOffer.id ? newOffer : o));
        } else {
            setOffers([...offers, newOffer]);
        }

        setShowModal(false);
    };

    const toggleOfferStatus = (id) => {
        setOffers(offers.map(o =>
            o.id === id ? { ...o, status: o.status === 'Active' ? 'Disabled' : 'Active' } : o
        ));
    };

    const deleteOffer = (id) => {
        if (window.confirm('Are you sure you want to delete this offer?')) {
            setOffers(offers.filter(o => o.id !== id));
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in-up">
            {/* 1. Page Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <FaTag className="text-purple-500" /> Offers
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Manage offers visible to customers
                    </p>
                </div>

                {hasOffers && (
                    <button
                        onClick={openCreateModal}
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <FaPlus /> Create Offer
                    </button>
                )}
            </div>

            {/* 2. Main Content */}
            {hasOffers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offers.map((offer) => (
                        <div key={offer.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            {/* Status Badge */}
                            <div className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${offer.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-500'
                                }`}>
                                {offer.status}
                            </div>

                            <div className="mb-4">
                                <h3 className="font-black text-slate-800 text-lg">{offer.title}</h3>
                                <p className="text-sm text-purple-600 font-bold mt-1">{offer.type}</p>
                                <p className="text-xs text-slate-400 mt-1">Applies to: {offer.match}</p>
                                {offer.validUntil && (
                                    <p className="text-xs text-slate-400 mt-1">Valid until: {new Date(offer.validUntil).toLocaleDateString()}</p>
                                )}
                            </div>

                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => openEditModal(offer)}
                                    className="flex-1 bg-slate-50 text-slate-600 font-bold text-xs py-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                                >
                                    <FaEdit /> Edit
                                </button>
                                <button
                                    onClick={() => toggleOfferStatus(offer.id)}
                                    className="flex-1 bg-slate-50 text-slate-600 font-bold text-xs py-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                                >
                                    {offer.status === 'Active' ? <><FaBan /> Disable</> : <><FaCheck /> Enable</>}
                                </button>
                                <button
                                    onClick={() => deleteOffer(offer.id)}
                                    className="w-10 bg-red-50 text-red-500 font-bold text-xs py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* 3. Empty State */
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 border-dashed">
                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                        <FaTag className="text-3xl text-purple-300" />
                    </div>
                    <h3 className="text-slate-800 font-bold text-lg mb-1">You don't have any active offers</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        Create offers to attract more customers to your shop.
                    </p>
                    <button
                        onClick={openCreateModal}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-slate-900/10 flex items-center gap-2 hover:bg-slate-800 hover:scale-105 transition-all"
                    >
                        <FaPlus /> Create your first offer
                    </button>
                </div>
            )}

            {/* Create/Edit Offer Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-slate-800">
                                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-slate-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Offer Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Weekend Special"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Discount Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Value</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        placeholder={formData.type === 'percentage' ? '10' : '50'}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Applies To</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.applicableTo}
                                    onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                                    placeholder="e.g., All Products, Groceries"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valid From</label>
                                    <input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Valid Until</label>
                                    <input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg"
                                >
                                    {editingOffer ? 'Update Offer' : 'Create Offer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerOffers;
