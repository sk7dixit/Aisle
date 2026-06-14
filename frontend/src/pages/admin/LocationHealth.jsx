import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiSearch, FiRefreshCw, FiMapPin, FiSave } from 'react-icons/fi';

const LocationHealth = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fixing, setFixing] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('aisleToken');
            const res = await fetch('/api/admin/shops-with-location-issues', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSellers(data || []);
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (sellerId, field, value) => {
        setEditData(prev => ({
            ...prev,
            [sellerId]: {
                ...prev[sellerId],
                [field]: value
            }
        }));
    };

    const fixLocation = async (sellerId) => {
        const data = editData[sellerId];
        if (!data?.lat || !data?.lng) {
            alert("Please provide both Latitude and Longitude");
            return;
        }

        setFixing(sellerId);
        try {
            const token = localStorage.getItem('aisleToken');
            const res = await fetch(`/api/admin/fix-shop-location/${sellerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("Location fixed and verified!");
                fetchIssues();
            } else {
                const err = await res.json();
                alert(err.message || "Fix failed");
            }
        } catch (error) {
            console.error("Fix failed", error);
        } finally {
            setFixing(null);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Location Health</h1>
                    <p className="text-slate-500 font-medium">Identify and repair shops with broken GPS metadata</p>
                </div>
                <button
                    onClick={fetchIssues}
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center p-20 text-slate-400">
                    <FiRefreshCw className="animate-spin text-4xl" />
                </div>
            ) : sellers.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCheckCircle size={32} />
                    </div>
                    <h2 className="text-xl font-black text-emerald-800">All Systems Healthy</h2>
                    <p className="text-emerald-600 font-medium">No sellers found with missing or malformed location data.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-amber-500 text-white rounded-xl">
                            <FiAlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-amber-800 font-black">Warning: {sellers.length} Shops Hidden</p>
                            <p className="text-amber-600 text-sm font-medium">These shops are excluded from customer discovery because they lack valid GPS coordinates.</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Seller Details</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Manual Geocode</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sellers.map(seller => (
                                    <tr key={seller._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-6">
                                            <p className="font-black text-slate-800">{seller.shopDetails?.shopName || seller.name}</p>
                                            <p className="text-slate-500 text-sm font-medium">{seller.email}</p>
                                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-tighter">
                                                {seller.shopDetails?.address || "No Address Provided"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Lat"
                                                    value={editData[seller._id]?.lat || ''}
                                                    onChange={(e) => handleInputChange(seller._id, 'lat', e.target.value)}
                                                    className="w-24 px-3 py-2 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Lng"
                                                    value={editData[seller._id]?.lng || ''}
                                                    onChange={(e) => handleInputChange(seller._id, 'lng', e.target.value)}
                                                    className="w-24 px-3 py-2 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="City"
                                                    value={editData[seller._id]?.city || ''}
                                                    onChange={(e) => handleInputChange(seller._id, 'city', e.target.value)}
                                                    className="w-32 px-3 py-2 bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button
                                                onClick={() => fixLocation(seller._id)}
                                                disabled={fixing === seller._id}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 ml-auto hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                <FiSave /> {fixing === seller._id ? 'Saving...' : 'Fix Location'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationHealth;
