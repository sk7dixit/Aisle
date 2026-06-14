import React from 'react';
import { MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BuiltForLocal = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: MapPin,
            title: "Real Nearby Businesses",
            desc: "Only physical businesses and home creators around you. No warehouses."
        },
        {
            icon: Clock,
            title: "Live Availability",
            desc: "See what’s in stock before you step out."
        },
        {
            icon: Users,
            title: "Direct Connection",
            desc: "Talk directly to businesses & creators. No middlemen."
        },
        {
            icon: DollarSign,
            title: "No Extra Charges",
            desc: "Buy at regular retail prices. No hidden fees."
        }
    ];

    return (
        <section className="bg-white py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Built for Nearby Discovery</h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Not delivery. Just nearby businesses & creators, available right now.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100 hover:border-teal-100 transition-colors"
                        >
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-6 text-teal-600">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={() => navigate('/explore')}
                        className="text-teal-600 font-bold hover:text-teal-700 hover:underline transition-all text-sm"
                    >
                        Explore Nearby Businesses →
                    </button>
                </div>
            </div>
        </section>
    );
};

export default BuiltForLocal;
