import React from 'react';
import { FaWallet, FaHistory, FaChartLine, FaStar, FaQuoteLeft, FaCheckCircle } from 'react-icons/fa';

export const ServiceEarnings = () => {
    const stats = [
        { label: "Total Revenue", value: "₹0", icon: <FaWallet />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Pending Payout", value: "₹0", icon: <FaHistory />, color: "text-indigo-400", bg: "bg-indigo-500/10" },
        { label: "Completion Rate", value: "100%", icon: <FaChartLine />, color: "text-cyan-400", bg: "bg-cyan-500/10" }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Overview</h1>
                <p className="text-slate-500 mt-1 font-medium">Track your earnings and payout history.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="service-card p-6 flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${s.bg} ${s.color}`}>
                            {s.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-white">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="service-card overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white">Job History</h3>
                    <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300">View All</button>
                </div>
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <FaHistory className="text-slate-500" size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-500 font-medium">No payout history available yet.</p>
                </div>
            </div>
        </div>
    );
};

export const ServiceReviews = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trust & Feedback</h1>
                <p className="text-slate-500 mt-1 font-medium">Manage your reputation and view customer feedback.</p>
            </div>

            <div className="grid md:grid-cols-[1fr,2fr] gap-8">
                {/* Rating Stats */}
                <div className="service-card p-8 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Overall Score</h3>
                    <div className="text-6xl font-black text-slate-900">0.0</div>
                    <div className="flex gap-1 text-slate-200 mt-4 mb-2">
                        {[1, 2, 3, 4, 5].map(star => <FaStar key={star} size={20} />)}
                    </div>
                    <p className="text-xs font-bold text-slate-500">Based on 0 reviews</p>
                </div>

                {/* Review List Empty State */}
                <div className="service-card p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/10">
                        <FaQuoteLeft size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white">Build your reputation.</h3>
                    <p className="text-slate-500 max-w-sm mt-2 text-sm font-medium leading-relaxed">
                        Quality service leads to great reviews! Once customers rate your service, those testimonials will shine here.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/10">
                            <FaCheckCircle /> Verified Reviews
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
