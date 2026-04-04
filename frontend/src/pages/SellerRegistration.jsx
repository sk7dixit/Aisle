import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaStore, FaMapMarkerAlt, FaCamera, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import IdentityAnimation from '../components/common/IdentityAnimation';

const SellerRegistration = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        shopName: '',
        category: 'Grocery & Daily Needs',
        customCategory: '',
        shopType: 'physical', // physical or home
        address: '',
        location: null, // { lat, lng }
        description: '',
        declaration: false
    });

    const [files, setFiles] = useState({
        shopFront: null,
        insideView: null,
        productShelf: null
    });

    const [previews, setPreviews] = useState({
        shopFront: null,
        insideView: null,
        productShelf: null
    });

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [fieldName]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [fieldName]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const physicalCategories = [
        'Grocery & Daily Needs', 'Stationery & Books', 'Electronics & Mobile Accessories',
        'Medical & Pharmacy', 'Hardware & Tools', 'Clothing & Footwear',
        'Fruits & Vegetables', 'Bakery & Sweets', 'Home & Kitchen Supplies',
        'Cosmetics & Personal Care', 'Other'
    ];

    const homeCategories = [
        'Home-Based Food Business', 'Handicrafts & Handmade Products',
        'Tailoring & Boutique', 'Art, Gifts & Custom Items',
        'Tiffin / Meal Services', 'Other'
    ];

    const currentCategories = formData.shopType === 'physical' ? physicalCategories : homeCategories;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            if (name === 'shopType') {
                return {
                    ...prev,
                    [name]: value,
                    category: value === 'physical' ? physicalCategories[0] : homeCategories[0],
                    customCategory: ''
                };
            }
            return { ...prev, [name]: type === 'checkbox' ? checked : value };
        });
    };

    const [fetchingLocation, setFetchingLocation] = useState(false);

    const handleLocation = () => {
        if (navigator.geolocation) {
            setFetchingLocation(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    let detectedAddress = '';
                    try {
                        // Reverse Geocoding using OpenStreetMap Nominatim API
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await response.json();
                        if (data && data.display_name) {
                            detectedAddress = data.display_name;
                        }
                    } catch (error) {
                        console.error("Geocoding error:", error);
                    }

                    setFormData(prev => ({
                        ...prev,
                        location: { lat, lng },
                        address: detectedAddress || prev.address // Use detected address, fallback to existing
                    }));
                    setFetchingLocation(false);
                },
                (error) => {
                    alert("Could not fetch location: " + error.message);
                    setFetchingLocation(false);
                }
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('shopName', formData.shopName);
            data.append('category', formData.category);
            data.append('customCategory', formData.customCategory);
            data.append('shopType', formData.shopType);
            data.append('address', formData.address);
            data.append('description', formData.description);
            data.append('declaration', formData.declaration);
            if (formData.location) {
                data.append('location', JSON.stringify(formData.location));
                data.append('lat', formData.location.lat);
                data.append('lng', formData.location.lng);
            }

            if (files.shopFront) data.append('shopFront', files.shopFront);
            if (files.insideView) data.append('insideView', files.insideView);
            if (files.productShelf) data.append('productShelf', files.productShelf);

            const token = user?.token || localStorage.getItem('token'); // Fallback if user context not fully populated?

            const response = await fetch('/api/auth/register-shop', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data // FormData automatically sets multipart/form-data
            });

            if (response.ok) {
                navigate('/seller/face-enrollment');
            } else {
                const err = await response.json();
                alert(err.message || "Failed to submit shop details");
            }
        } catch (error) {
            console.error("Registration Error", error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-2xl z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <IdentityAnimation role="seller" />
                    <h1 className="text-3xl font-bold text-white mb-2">Complete Shop Registration</h1>
                    <p className="text-gray-400">Step {step} of 2: {step === 1 ? 'Shop Details' : 'Photos & Verification'}</p>
                </div>

                {/* Main Card */}
                <div className="bg-[#0B0F14] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                        <div
                            className="h-full bg-accent transition-all duration-500"
                            style={{ width: step === 1 ? '50%' : '100%' }}
                        ></div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in text-left">
                                {/* Shop Name */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Shop Name</label>
                                    <input
                                        name="shopName" type="text"
                                        className="w-full bg-[#161B22] text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder-gray-600"
                                        placeholder="e.g. Fresh Mart"
                                        value={formData.shopName} onChange={handleChange} required
                                    />
                                </div>

                                {/* Category & Type */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Shop Type</label>
                                        <div className="flex bg-[#161B22] p-1 rounded-xl border border-gray-700 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => handleChange({ target: { name: 'shopType', value: 'physical' } })}
                                                className={`flex-1 py-2 text-sm rounded-lg transition-all ${formData.shopType === 'physical' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Physical Shop
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange({ target: { name: 'shopType', value: 'home' } })}
                                                className={`flex-1 py-2 text-sm rounded-lg transition-all ${formData.shopType === 'home' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Home Business
                                            </button>
                                        </div>

                                        <label className="block text-gray-400 text-sm mb-2">Category</label>
                                        <select
                                            name="category"
                                            className="w-full bg-[#161B22] text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-accent outline-none appearance-none mb-2"
                                            value={formData.category} onChange={handleChange}
                                        >
                                            {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>

                                        {formData.category === 'Other' && (
                                            <input
                                                type="text"
                                                name="customCategory"
                                                placeholder="Enter your category..."
                                                className="w-full bg-[#161B22] text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-accent outline-none animate-fade-in"
                                                value={formData.customCategory || ''}
                                                onChange={handleChange}
                                                required
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Address & Location */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Shop Address</label>
                                    <textarea
                                        name="address"
                                        rows="3"
                                        className="w-full bg-[#161B22] text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-accent outline-none transition-all placeholder-gray-600 mb-3"
                                        placeholder="Full address of your shop..."
                                        value={formData.address} onChange={handleChange} required
                                    ></textarea>

                                    <button
                                        type="button"
                                        onClick={handleLocation}
                                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-all ${formData.location ? 'border-accent text-accent bg-accent/10' : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'}`}
                                    >
                                        <FaMapMarkerAlt />
                                        {formData.location ? 'Location Pin Captured' : 'Get Current Location'}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors mt-4"
                                >
                                    Next Step
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in text-left">
                                {/* Photo Upload Section */}
                                <div className="space-y-4">
                                    {/* Shop Front */}
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="shopFront"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'shopFront')}
                                        />
                                        <label
                                            htmlFor="shopFront"
                                            className="block border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-accent/50 transition-colors cursor-pointer bg-[#161B22]/50 relative overflow-hidden"
                                        >
                                            {previews.shopFront ? (
                                                <img src={previews.shopFront} alt="Shop Front" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60 hover:opacity-100 transition-opacity" />
                                            ) : null}
                                            <div className="relative z-10">
                                                <FaCamera className={`text-4xl mx-auto mb-3 ${previews.shopFront ? 'text-white drop-shadow-md' : 'text-gray-500'}`} />
                                                <p className={`font-medium ${previews.shopFront ? 'text-white' : 'text-gray-300'}`}>
                                                    {previews.shopFront ? 'Change Shop Front Photo' : 'Upload Shop Front Photo'}
                                                </p>
                                                {!previews.shopFront && <p className="text-gray-500 text-xs mt-1">Increases trust by 40%</p>}
                                            </div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Inside View */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="insideView"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'insideView')}
                                            />
                                            <label
                                                htmlFor="insideView"
                                                className="block border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-accent/50 transition-colors cursor-pointer bg-[#161B22]/50 h-32 flex flex-col items-center justify-center relative overflow-hidden"
                                            >
                                                {previews.insideView ? (
                                                    <img src={previews.insideView} alt="Inside View" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <span className="text-sm text-gray-400">+ Inside View</span>
                                                )}
                                            </label>
                                        </div>

                                        {/* Product Shelf */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="productShelf"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'productShelf')}
                                            />
                                            <label
                                                htmlFor="productShelf"
                                                className="block border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-accent/50 transition-colors cursor-pointer bg-[#161B22]/50 h-32 flex flex-col items-center justify-center relative overflow-hidden"
                                            >
                                                {previews.productShelf ? (
                                                    <img src={previews.productShelf} alt="Product Shelf" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <span className="text-sm text-gray-400">+ Product Shelf</span>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Declaration */}
                                <div className="flex items-start gap-3 bg-accent/5 p-4 rounded-xl border border-accent/10">
                                    <input
                                        type="checkbox"
                                        name="declaration"
                                        checked={formData.declaration}
                                        onChange={handleChange}
                                        className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-accent focus:ring-accent"
                                        required
                                    />
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        I confirm that the information provided is accurate and represents a real business. I understand the <a href="#" className="text-accent underline">Terms & Conditions</a>.
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-1/3 bg-gray-800 text-white font-bold py-3.5 rounded-xl hover:bg-gray-700 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.declaration}
                                        className="w-2/3 bg-gradient-to-r from-accent to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-background font-bold py-3.5 rounded-xl shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Submitting...' : 'Submit for Verification'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SellerRegistration;
