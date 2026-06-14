import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LocationVerification = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const fetchUnverifiedShops = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('aisleUser'));
            const token = storedUser?.token;
            const res = await axios.get('/api/admin/unverified-shops', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShops(res.data);
        } catch (error) {
            console.error('Error fetching unverified shops:', error);
        } finally {
            setLoading(false);
        }
    };

    const verifyLocation = async (sellerId) => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('aisleUser'));
            const token = storedUser?.token;
            await axios.post(`/api/admin/verify-shop-location/${sellerId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Shop location verified successfully');
            setShops(shops.filter(shop => shop._id !== sellerId));
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error verifying location:', error);
            alert(error.response?.data?.message || 'Verification failed');
        }
    };

    useEffect(() => {
        fetchUnverifiedShops();
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading unverified shops...</div>;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-[1200px] mx-auto space-y-8 bg-[#F2F2F2]">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Shop Location Verification</h1>
                <p className="text-sm text-gray-500 mt-1">Confirm and lock shop locations for customer discovery.</p>
            </div>

            {message && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-bold">
                    {message}
                </div>
            )}

            <div className="grid gap-6">
                {shops.length > 0 ? (
                    shops.map(shop => (
                        <div key={shop._id} className="bg-white border border-[#CBCBCB] rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{shop.shopDetails?.shopName || shop.name}</h3>
                                <div className="text-sm text-gray-500 mt-1">
                                    <p>Address: <span className="text-gray-900 font-medium">{shop.shopDetails?.address}</span></p>
                                    <p>City: <span className="text-gray-900 font-medium">{shop.shopDetails?.city}</span></p>
                                    <p className="text-[10px] font-mono mt-1">
                                        GPS: {shop.shopDetails?.shopLocation?.coordinates?.join(', ')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => verifyLocation(shop._id)}
                                className="px-6 py-2.5 bg-[#174D38] text-white hover:bg-[#123d2c] text-sm font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap"
                            >
                                Verify & Lock Location
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="bg-white border border-[#CBCBCB] rounded-xl p-12 text-center">
                        <h3 className="text-gray-900 font-bold mb-1">No unverified shop locations.</h3>
                        <p className="text-sm text-gray-500">All shops have verified locations.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationVerification;
