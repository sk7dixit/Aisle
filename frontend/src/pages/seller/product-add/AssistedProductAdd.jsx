import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHandshake, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const AssistedProductAdd = () => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [requested, setRequested] = useState(false);

    const handleRequestAssistance = async () => {
        if (!window.confirm("Our team will call you to schedule a visit. Proceed?")) return;

        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/support/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user._id,
                    phone: user.phone || user.email,
                    category: 'ASSISTED_LISTING',
                    summary: 'Seller requested Assisted Listing service',
                    logs: { source: 'Seller Dashboard Hub' }
                })
            });

            if (res.ok) {
                setRequested(true);
                toast.success('Request received! We will contact you shortly.');
            } else {
                toast.error('Failed to submit request. Please try again.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-6">
            <div className="bg-white rounded-[2rem] p-16 text-center shadow-sm max-w-2xl w-full mx-auto">

                {/* Icon Circle */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 transition-colors ${requested ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-800'}`}>
                    {requested ? <FaCheckCircle /> : <FaHandshake />}
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                    {requested ? 'Request Received!' : 'Assisted Listing Service'}
                </h1>

                {/* Description */}
                <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg mx-auto mb-10">
                    {requested
                        ? "Our team has been notified. We will call you within 24 hours to schedule your shop visit."
                        : "Our team will visit your shop or take your inventory list to populate your Aisle digital shelf."
                    }
                </p>

                {/* Badge or Button */}
                {!requested ? (
                    <div className="flex flex-col items-center gap-6 mb-12">
                        <div className="inline-block bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-full uppercase tracking-widest">
                            PAID SERVICE · VERIFIED BY AISLE
                        </div>

                        <button
                            onClick={handleRequestAssistance}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <FaSpinner className="animate-spin" />}
                            CONFIRM REQUEST
                        </button>
                    </div>
                ) : (
                    <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-6 py-3 rounded-full uppercase tracking-widest mb-12">
                        REQUEST ID: #{Math.floor(Math.random() * 10000)}
                    </div>
                )}

                {/* Return Link */}
                <div className="block">
                    <Link
                        to="/seller/products"
                        className="text-slate-800 font-bold border-b-2 border-slate-800 pb-1 hover:opacity-75 transition-opacity text-lg"
                    >
                        Return to Hub
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default AssistedProductAdd;
