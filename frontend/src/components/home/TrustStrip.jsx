import { motion } from 'framer-motion';
import { ShieldCheck, DollarSign, Heart, CheckCircle } from 'lucide-react';

const TrustStrip = () => {
    return (
        <section className="py-20 bg-surface-muted">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                {/* Header */}
                <div className="max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary-light/30 bg-white shadow-card mb-6">
                        <CheckCircle className="text-green-500 mr-2" size={16} />
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            Availability Verified
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-dark tracking-tight mb-6">
                        Why Neighbors Love ShopLens
                    </h2>
                    <p className="text-lg text-dark-muted">
                        Online convenience, no markup, no hidden fees. Just direct local connections.
                    </p>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-white rounded-3xl p-8 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1 team-card border border-surface-muted">
                        <div className="h-16 w-16 mb-6 rounded-2xl bg-pastel-mint text-primary flex items-center justify-center mx-auto">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-dark mb-3">Real Shops, Real People.</h3>
                        <p className="text-dark-muted text-sm leading-relaxed">
                            Every shop is physically verified. We review and tune inventory before they go live on the map.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white rounded-3xl p-8 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1 team-card border border-surface-muted">
                        <div className="h-16 w-16 mb-6 rounded-2xl bg-pastel-mint text-primary flex items-center justify-center mx-auto">
                            <DollarSign size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-dark mb-3">Pay What the Shop Charges.</h3>
                        <p className="text-dark-muted text-sm leading-relaxed">
                            No hidden service fees. You pay the exact store price. No delivery fees, no platform commissions.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-3xl p-8 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1 team-card border border-surface-muted">
                        <div className="h-16 w-16 mb-6 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                            <Heart size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-dark mb-3">Support Local Business.</h3>
                        <p className="text-dark-muted text-sm leading-relaxed">
                            Connect with your neighborhood. Your money stays in your community, keeping local families viable.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustStrip;
