import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import maleAvatar from '../../assets/images/male_avatar.png';
import femaleAvatar from '../../assets/images/female_avatar.png';
import maleSellerAvatar from '../../assets/images/male_seller_avatar.png';
import femaleSellerAvatar from '../../assets/images/female_seller_avatar.png';

const IdentityAnimation = ({ role = 'customer', gender: externalGender, setGender: externalSetGender }) => {
    const [localGender, setLocalGender] = useState('male');

    const gender = externalGender || localGender;
    const setGender = externalSetGender || setLocalGender;

    useEffect(() => {
        const interval = setInterval(() => {
            setGender(prev => prev === 'male' ? 'female' : 'male');
        }, 5000); // Auto flip every 5 seconds
        return () => clearInterval(interval);
    }, [setGender]);

    const avatars = {
        customer: { male: maleAvatar, female: femaleAvatar },
        seller: { male: maleSellerAvatar, female: femaleSellerAvatar }
    };

    const currentAvatars = avatars[role] || avatars.customer;

    return (
        <div className="relative flex flex-col items-center justify-center mb-3">
            {/* Rotating Decorative Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
                className="absolute w-[130px] h-[130px] rounded-full border-2 border-blue-500/10 pointer-events-none"
            />

            <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute w-[145px] h-[145px] rounded-full border border-blue-500/5 pointer-events-none"
            />

            {/* 3D Flip Avatar - Security Animation */}
            <div style={{ perspective: 1000 }}>
                <motion.div
                    animate={{ rotateY: gender === 'male' ? 0 : 180 }}
                    transition={{ duration: 1.2, type: "spring", stiffness: 100, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-[115px] h-[115px] rounded-full relative shadow-[0_20px_50px_rgba(59,130,246,0.15)]"
                >
                    {/* Front - Male */}
                    <div
                        className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-blue-50 to-white flex items-center justify-center border-4 border-white overflow-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <img src={currentAvatars.male} alt="Male" className="w-full h-full object-cover" />
                    </div>

                    {/* Back - Female */}
                    <div
                        className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-pink-50 to-white flex items-center justify-center border-4 border-white overflow-hidden"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <img src={currentAvatars.female} alt="Female" className="w-full h-full object-cover" />
                    </div>
                </motion.div>
            </div>

            <div className="mt-2 flex flex-col items-center">
                <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border ${gender === 'male' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-pink-50 border-pink-100 text-pink-600'}`}>
                    {role === 'seller' ? 'Seller Security Scan' : 'AI Security Scan Active'}
                </div>
            </div>
        </div>
    );
};

export default IdentityAnimation;
