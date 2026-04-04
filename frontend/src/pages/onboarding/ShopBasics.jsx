import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaArrowRight, FaArrowLeft, FaMapMarkerAlt, FaStoreAlt, FaInfoCircle } from 'react-icons/fa';
import AmbientBackground from '../../components/AmbientBackground';
import { LOCATION_DATA } from '../../utils/locations';
import ShopTypeGuideModal from '../../components/onboarding/ShopTypeGuideModal';

const ShopBasics = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        shopCategory: '',
        state: '',
        area: '',
        city: ''
    });
    const [showGuide, setShowGuide] = useState(false);

    // Load previous step data
    const prevData = location.state || {}; // Needs ownerName, shopName, mobile

    useEffect(() => {
        if (!prevData.shopName) {
            navigate('/seller/onboarding'); // Redirect if no previous data
        }
    }, [prevData, navigate]);

    const shopTypes = [
        "Grocery / Kirana",
        "Electrical, Hardware & Auto",
        "Tech & Accessories",
        "Student & Office Supplies",
        "Home & Lifestyle Goods",
        "Pharmacy / Medical Store",
        "Home Businesses",
        "Seasonal / Festive Store"
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Combine data and move to account creation
        navigate('/seller/onboarding/account', { state: { ...prevData, ...formData } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background font-sans">
            <AmbientBackground />

            <div className="w-full max-w-[600px] z-10">
                <div className="animate-fade-in mb-8">
                    <Link to="/seller/onboarding" className="inline-flex items-center text-text-tertiary hover:text-text-primary transition-colors mb-4 group">
                        <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Tell us more about your shop</h1>
                    <p className="text-text-secondary">Helping customers find you properly.</p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-soft p-8 md:p-10 animate-fade-up">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Shop Type */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <label className="block text-sm font-medium text-text-secondary">Shop Type</label>
                                <button
                                    type="button"
                                    onClick={() => setShowGuide(true)}
                                    className="text-text-tertiary hover:text-accent-end transition-colors"
                                    title="View Shop Type Guide"
                                >
                                    <FaInfoCircle size={14} />
                                </button>
                            </div>
                            <div className="relative">
                                <FaStoreAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary z-10" />
                                <select
                                    name="shopCategory"
                                    className="w-full bg-white/5 text-text-primary pl-12 pr-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 appearance-none transition-all cursor-pointer"
                                    value={formData.shopCategory} onChange={handleChange} required
                                >
                                    <option value="" disabled className="bg-slate-900 text-text-tertiary">Select Type</option>
                                    {shopTypes.map(type => (
                                        <option key={type} value={type} className="bg-slate-900">{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Location Group */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Area / Locality</label>
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary z-10" />
                                    <input
                                        name="area"
                                        type="text"
                                        placeholder="e.g. Indiranagar"
                                        className="w-full bg-white/5 text-text-primary pl-12 pr-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 transition-all placeholder-text-tertiary"
                                        value={formData.area} onChange={handleChange} required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">State</label>
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary z-10" />
                                    <select
                                        name="state"
                                        className="w-full bg-white/5 text-text-primary pl-12 pr-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 appearance-none transition-all cursor-pointer"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })} // Reset city
                                        required
                                    >
                                        <option value="" disabled className="bg-slate-900 text-text-tertiary">Select State</option>
                                        {Object.keys(LOCATION_DATA).map(state => (
                                            <option key={state} value={state} className="bg-slate-900">{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">City</label>
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary z-10" />
                                    <select
                                        name="city"
                                        className="w-full bg-white/5 text-text-primary pl-12 pr-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 appearance-none transition-all cursor-pointer"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.state}
                                    >
                                        <option value="" disabled className="bg-slate-900 text-text-tertiary">Select City</option>
                                        {formData.state && LOCATION_DATA[formData.state]?.map(city => (
                                            <option key={city} value={city} className="bg-slate-900">{city}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-accent-start to-accent-end text-white font-bold py-4 rounded-xl shadow-lg shadow-accent-end/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-4"
                        >
                            Continue <FaArrowRight />
                        </button>
                    </form>
                </div>
            </div>

            {showGuide && <ShopTypeGuideModal onClose={() => setShowGuide(false)} />}
        </div>
    );
};

export default ShopBasics;
