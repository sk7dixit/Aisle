import React from 'react';
import { FaUpload, FaTable, FaListCheck, FaCheck } from 'react-icons/fa6';

const steps = [
    { id: 1, label: "Upload File", icon: FaUpload },
    { id: 2, label: "Verify List", icon: FaTable },
    { id: 3, label: "Review & Edit", icon: FaListCheck }
];

const BulkUploadStepper = ({ currentStep }) => {
    return (
        <div className="w-full max-w-4xl mx-auto mb-10">
            <div className="relative flex items-center justify-between">

                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-emerald-500 animate-progress-flow -z-10 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const Icon = isCompleted ? FaCheck : step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all duration-500 border-[6px]
                                    ${isActive
                                        ? 'bg-indigo-600 border-[#E0E7FF] text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)] scale-110 animate-active-focus'
                                        : isCompleted
                                            ? 'bg-emerald-500 border-emerald-50 text-white shadow-md animate-breathe'
                                            : 'bg-white border-[#F1F5F9] text-slate-300'
                                    }`}
                            >
                                <Icon className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} size={isActive ? 20 : 18} />
                            </div>
                            <span
                                className={`text-xs font-black uppercase tracking-[0.05em] transition-all duration-300 transform translate-y-1
                                    ${isActive ? 'text-indigo-900 scale-105' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}
                                `}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BulkUploadStepper;
