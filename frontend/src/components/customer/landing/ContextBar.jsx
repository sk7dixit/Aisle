import React from 'react';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';

const ContextBar = ({ loading }) => {
    const { user } = useAuth();
    const area = user?.customerLocation?.area || 'Locating...';
    const city = user?.customerLocation?.city || '';

    return (
        <div className="bg-blue-50/80 border-b border-blue-100 px-4 py-2 sticky top-16 z-20 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-blue-800">
                {loading ? (
                    <>
                        <FaSpinner className="animate-spin" />
                        <span>Finding nearby shops...</span>
                    </>
                ) : (
                    <>
                        <FaMapMarkerAlt className="text-blue-600" />
                        <span>Showing shops near <b>{area}</b>{city && `, ${city}`}</span>
                        {/* <span className="text-blue-400 mx-1">•</span>
                        <span className="text-blue-500">Updated just now</span> */}
                    </>
                )}
            </div>
        </div>
    );
};

export default ContextBar;
