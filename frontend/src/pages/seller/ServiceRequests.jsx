import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaPhone, FaMapMarkerAlt, FaCheck, FaTimes, FaInbox } from 'react-icons/fa';

const ServiceRequests = () => {
    const { token } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/seller/leads', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setLeads(data);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/seller/leads/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setLeads(leads.map(lead => lead._id === id ? { ...lead, status } : lead));
            }
        } catch (error) {
            console.error("Failed to update lead status", error);
        }
    };

    if (loading) return <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl"></div>)}
    </div>;

    const newRequests = leads.filter(l => l.status === 'new');
    const activeJobs = leads.filter(l => l.status === 'accepted');

    return (
        <div className="space-y-10 animate-fade-in">
            <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                    Incoming Requests
                </h2>
                {newRequests.length === 0 ? (
                    <div className="service-card p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/5">
                            <FaInbox size={32} className="text-slate-500" />
                        </div>
                        <p className="font-bold text-slate-500 font-medium">No new requests found.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {newRequests.map(lead => (
                            <div key={lead._id} className="service-card p-6 flex flex-wrap items-center justify-between gap-6">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/10">
                                        {lead.buyerId?.name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{lead.buyerId?.name || 'Anonymous Customer'}</h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
                                            <span className="flex items-center gap-1"><FaPhone size={10} className="text-indigo-400" /> {lead.buyerId?.phone}</span>
                                            <span className="flex items-center gap-1"><FaMapMarkerAlt size={10} className="text-indigo-400" /> {lead.buyerId?.address || 'Near Store'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => updateStatus(lead._id, 'accepted')}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 hover:bg-emerald-500 transition-all active:scale-95"
                                    >
                                        <FaCheck /> Accept
                                    </button>
                                    <button
                                        onClick={() => updateStatus(lead._id, 'rejected')}
                                        className="px-6 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-bold border border-white/5 hover:bg-rose-500/10 hover:text-rose-400 transition-all active:scale-95"
                                    >
                                        <FaTimes /> Skip
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <span className="w-2 h-8 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
                    Active Jobs
                </h2>
                <div className="grid gap-4">
                    {activeJobs.map(lead => (
                        <div key={lead._id} className="service-card p-6 flex items-center justify-between border-dashed">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/10">
                                    {lead.buyerId?.name?.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white/90">{lead.buyerId?.name}</h4>
                                    <p className="text-xs text-slate-500 font-medium">Contact: {lead.buyerId?.phone}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/10">In Progress</span>
                        </div>
                    ))}
                    {activeJobs.length === 0 && <p className="text-sm text-slate-500 italic font-medium">No active jobs at the moment.</p>}
                </div>
            </section>
        </div>
    );
};

export default ServiceRequests;
