import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaSave, FaUserCircle, FaMapMarkedAlt, FaDollarSign, FaAward } from 'react-icons/fa';

const ServiceProfile = () => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        shopName: user?.shopDetails?.shopName || '',
        pricing: 'Hourly / Fixed', // Mock
        radius: '5', // Mock
        experience: '3+ Years', // Mock
        description: 'Professional ' + user?.shopDetails?.category + ' services.'
    });

    const handleSave = async () => {
        setLoading(true);
        // Mock update - would normally call updateSellerProfile
        setTimeout(() => {
            setLoading(false);
            alert("Profile preferences saved!");
        }, 800);
    };

    return (
        <div className="max-w-4xl space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Service Profile</h1>
                    <p className="text-slate-500 font-medium">Define your expertise and work preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-500 active:scale-95 transition-all shadow-xl shadow-indigo-900/20 disabled:opacity-50"
                >
                    <FaSave /> {loading ? 'Saving...' : 'Save Profile'}
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Identity Card */}
                <div className="service-card p-8 md:col-span-2 flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-500 border border-white/10 shadow-inner">
                        <FaUserCircle size={48} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">{user?.name}</h2>
                        <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/10 mt-2 inline-block">{user?.shopDetails?.category}</span>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="service-card p-8 space-y-6">
                    <h3 className="font-black text-white flex items-center gap-2">
                        <FaDollarSign className="text-emerald-400" /> Pricing & Radius
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Pricing Model</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={formData.pricing}
                                onChange={e => setFormData({ ...formData, pricing: e.target.value })}
                            >
                                <option className="bg-[#1e293b]">Fixed Price per Job</option>
                                <option className="bg-[#1e293b]">Hourly Rate</option>
                                <option className="bg-[#1e293b]">Quote after Inspection</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Service Radius (km)</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={formData.radius}
                                onChange={e => setFormData({ ...formData, radius: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="service-card p-8 space-y-6">
                    <h3 className="font-black text-white flex items-center gap-2">
                        <FaAward className="text-indigo-400" /> Experience
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Years of Experience</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={formData.experience}
                                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">About Your Service</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 transition-all"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your specialty..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceProfile;
