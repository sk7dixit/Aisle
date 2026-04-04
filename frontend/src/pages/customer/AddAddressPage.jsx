import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { MapPin, Home, Briefcase, Navigation, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AddAddressPage = () => {
    const navigate = useNavigate();
    const { userLocation, setUserLocation } = useLocation(); // Context

    // Local state for form
    const [formData, setFormData] = useState({
        receiverName: '',
        houseNo: '',
        street: '', // Area
        landmark: '',
        pincode: '',
        city: '',
        state: '',
        itemType: 'Home' // Home, Work, Other
    });

    const [loading, setLoading] = useState(false);

    // Prefill from LocationContext if available (GPS data)
    useEffect(() => {
        if (userLocation) {
            setFormData(prev => ({
                ...prev,
                city: userLocation.city || '',
                state: userLocation.country || '', // Mapping country/state roughly for now if needed, or adjust context
                street: userLocation.area || '',
                pincode: userLocation.pincode || ''
            }));
        }
    }, [userLocation]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token'); // Assuming standard token storage

        try {
            const response = await fetch('/api/customer/profile/address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    coordinates: {
                        lat: userLocation?.lat || 0,
                        lng: userLocation?.lng || 0
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save address');
            }

            toast.success('Address Saved Successfully!');

            // Update Context with full details
            setUserLocation({
                ...userLocation,
                area: formData.street,
                city: formData.city,
                address: `${formData.houseNo}, ${formData.street}, ${formData.city}`
            });

            // Redirect to Home or previous page
            setTimeout(() => navigate('/home'), 1000);

        } catch (error) {
            console.error('Save Address Error:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-[#E07A5F] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#E07A5F] to-[#F2CC8F] px-6 py-8 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                                <MapPin className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Confirm Delivery Location</h1>
                                <p className="text-white/90 text-sm mt-1">Please enter precise address details for delivery.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Map Placeholder / Location Summary */}
                        <div className="mb-8 bg-orange-50 rounded-xl p-4 border border-orange-100 flex items-start gap-3">
                            <Navigation className="w-5 h-5 text-[#E07A5F] mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">Detected Location</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {userLocation?.address || "Reading GPS coordinates..."}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Address Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Save address as</label>
                                <div className="flex gap-4">
                                    {['Home', 'Work', 'Other'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, itemType: type })}
                                            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 border transition-all ${formData.itemType === type
                                                    ? 'bg-[#E07A5F] text-white border-[#E07A5F] shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {type === 'Home' && <Home size={16} />}
                                            {type === 'Work' && <Briefcase size={16} />}
                                            {type === 'Other' && <MapPin size={16} />}
                                            <span className="text-sm font-medium">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Receiver's Name *</label>
                                    <input
                                        type="text"
                                        name="receiverName"
                                        required
                                        value={formData.receiverName}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Flat / House No / Building *</label>
                                    <input
                                        type="text"
                                        name="houseNo"
                                        required
                                        value={formData.houseNo}
                                        onChange={handleChange}
                                        placeholder="e.g. Flat 402, Galaxy Apartments"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Area / Colony / Street *</label>
                                    <input
                                        type="text"
                                        name="street"
                                        required
                                        value={formData.street}
                                        onChange={handleChange}
                                        placeholder="e.g. Sector 62, Near Metro Station"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        required
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all bg-gray-50"
                                        readOnly // Usually auto-detected
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        required
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nearby Landmark (Optional)</label>
                                    <input
                                        type="text"
                                        name="landmark"
                                        value={formData.landmark}
                                        onChange={handleChange}
                                        placeholder="e.g. Behind Siva Temple"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E07A5F]/20 focus:border-[#E07A5F] outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#E07A5F] hover:bg-[#d0694e] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Address & Continue
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddAddressPage;
