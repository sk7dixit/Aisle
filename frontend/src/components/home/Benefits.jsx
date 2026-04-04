import React from 'react';
import { benefits } from '../../data/mockData';
import * as Icons from 'lucide-react';
import { Card } from '../ui/card';

const Benefits = () => {
    const colorMap = {
        teal: 'from-teal-500 to-teal-600',
        coral: 'from-coral-500 to-coral-600',
        yellow: 'from-amber-500 to-amber-600'
    };

    const bgColorMap = {
        teal: 'bg-teal-50 border-teal-200',
        coral: 'bg-coral-50 border-coral-200',
        yellow: 'bg-amber-50 border-amber-200'
    };

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(30deg, #14b8a6 12%, transparent 12.5%, transparent 87%, #14b8a6 87.5%, #14b8a6),
            linear-gradient(150deg, #14b8a6 12%, transparent 12.5%, transparent 87%, #14b8a6 87.5%, #14b8a6),
            linear-gradient(30deg, #14b8a6 12%, transparent 12.5%, transparent 87%, #14b8a6 87.5%, #14b8a6),
            linear-gradient(150deg, #14b8a6 12%, transparent 12.5%, transparent 87%, #14b8a6 87.5%, #14b8a6)`,
                    backgroundSize: '80px 140px',
                    backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px'
                }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-2 bg-teal-100 rounded-full border border-teal-200 mb-4">
                        <span className="text-sm font-semibold text-teal-700 uppercase flex items-center gap-2">
                            <Icons.CheckCircle className="w-4 h-4" />
                            Availability Verified
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Why Neighbors Love ShopLens
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Shopping, stripped of nonsense. No markups, no hidden fees, just direct local connections.
                    </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((benefit, index) => {
                        const IconComponent = Icons[benefit.icon] || Icons.Star;

                        return (
                            <Card
                                key={benefit.id}
                                className={`group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border-2 ${bgColorMap[benefit.color]} animate-fadeInUp overflow-hidden`}
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {/* Background Gradient on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[benefit.color]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                                {/* Icon Container */}
                                <div className="relative mb-6">
                                    <div className={`w-20 h-20 bg-gradient-to-br ${colorMap[benefit.color]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                        <IconComponent className="w-10 h-10 text-white" />
                                    </div>
                                    {/* Decorative Circle */}
                                    <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br ${colorMap[benefit.color]} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>
                                </div>

                                {/* Content */}
                                <div className="relative">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors duration-300">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </div>

                                {/* Hover Arrow */}
                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <Icons.ArrowRight className={`w-6 h-6 bg-gradient-to-r ${colorMap[benefit.color]} bg-clip-text text-transparent`} />
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Stats Section */}
                <div className="mt-20 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 rounded-3xl p-12 shadow-2xl">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-white mb-2">2,500+</div>
                            <div className="text-teal-100 font-medium">Active Shops</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold text-white mb-2">50,000+</div>
                            <div className="text-teal-100 font-medium">Happy Customers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold text-white mb-2">100K+</div>
                            <div className="text-teal-100 font-medium">Products Listed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold text-white mb-2">25+</div>
                            <div className="text-teal-100 font-medium">Cities Covered</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Benefits;
