import React, { useState, useEffect } from 'react';
import { testimonials } from '../../data/mockData';
import { Star, Quote } from 'lucide-react';
import { Card } from '../ui/card';

const Testimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-coral-200 rounded-full opacity-20 animate-float"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-teal-200 rounded-full opacity-20 animate-float animation-delay-2000"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-coral-100 rounded-full border border-coral-200 mb-4">
                        <Quote className="w-4 h-4 text-coral-600" />
                        <span className="text-sm font-semibold text-coral-700 uppercase">Success Stories</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Real People, Real Results
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Join thousands discovering local shops and supporting their communities
                    </p>
                </div>

                {/* Featured Testimonial */}
                <div className="mb-12">
                    <Card className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-gray-100 transform hover:scale-105 transition-all duration-500">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            {/* Image */}
                            <div className="flex-shrink-0">
                                <div className="relative">
                                    <img
                                        src={testimonials[currentIndex].image}
                                        alt={testimonials[currentIndex].name}
                                        className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover shadow-xl"
                                    />
                                    <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Quote className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-center md:text-left">
                                {/* Stars */}
                                <div className="flex justify-center md:justify-start gap-1 mb-4">
                                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                        <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>

                                {/* Testimonial Text */}
                                <blockquote className="text-2xl md:text-3xl font-medium text-gray-900 mb-6 leading-relaxed">
                                    "{testimonials[currentIndex].text}"
                                </blockquote>

                                {/* Author Info */}
                                <div>
                                    <p className="text-xl font-bold text-gray-900">{testimonials[currentIndex].name}</p>
                                    <p className="text-gray-600">{testimonials[currentIndex].role} • {testimonials[currentIndex].location}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Navigation Dots */}
                    <div className="flex justify-center gap-3 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-3 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-12 bg-teal-600' : 'w-3 bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* All Testimonials Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <Card
                            key={testimonial.id}
                            className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 ${currentIndex === index ? 'ring-2 ring-teal-500' : ''
                                }`}
                        >
                            {/* Image */}
                            <img
                                src={testimonial.image}
                                alt={testimonial.name}
                                className="w-16 h-16 rounded-2xl object-cover mb-4"
                            />

                            {/* Stars */}
                            <div className="flex gap-1 mb-3">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            {/* Text */}
                            <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                                "{testimonial.text}"
                            </p>

                            {/* Author */}
                            <div className="pt-4 border-t border-gray-100">
                                <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                                <p className="text-xs text-gray-500">{testimonial.role}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
