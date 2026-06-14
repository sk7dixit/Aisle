import { Star, Store, Users, MapPin, Box } from 'lucide-react';

const StatsStrip = () => {
    const stats = [
        { label: "Businesses Joined", value: "2,500+", icon: <Store className="w-5 h-5 text-teal-200" /> },
        { label: "Happy Customers", value: "50,000+", icon: <Users className="w-5 h-5 text-teal-200" /> },
        { label: "Products Listed", value: "100K+", icon: <Box className="w-5 h-5 text-teal-200" /> },
        { label: "Cities Covered", value: "25+", icon: <MapPin className="w-5 h-5 text-teal-200" /> }
    ];

    return (
        <section className="bg-primary py-10 border-y border-primary-hover">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex flex-col items-center text-center group hover:-translate-y-1 transition-transform duration-300">
                            <div className="mb-3 p-3 bg-primary-hover rounded-2xl group-hover:bg-primary-light transition-colors shadow-sm">
                                {stat.icon}
                            </div>
                            <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-xs font-bold text-primary-subtle uppercase tracking-widest opacity-90">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsStrip;
