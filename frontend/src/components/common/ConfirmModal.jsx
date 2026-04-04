import React from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiAlertTriangle, FiInfo, FiCheckCircle, FiHelpCircle } from 'react-icons/fi';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Proceed',
    cancelLabel = 'Cancel',
    type = 'info', // info, warning, danger, success
    confirmVariant = 'default' // default, danger, success
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning': return <FiAlertTriangle className="text-orange-500" size={24} />;
            case 'danger': return <FiAlertTriangle className="text-red-500" size={24} />;
            case 'success': return <FiCheckCircle className="text-green-500" size={24} />;
            default: return <FiInfo className="text-blue-500" size={24} />;
        }
    };

    const getConfirmBtnClass = () => {
        if (confirmVariant === 'danger') return 'bg-red-600 hover:bg-red-700 text-white shadow-red-100';
        if (confirmVariant === 'success') return 'bg-green-600 hover:bg-green-700 text-white shadow-green-100';
        return 'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-200';
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/60 overflow-hidden animate-zoom-in">
                {/* Header */}
                <div className="p-6 pb-0 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            {getIcon()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 leading-tight">{title}</h3>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">Governance Action Required</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50 transition-all active:scale-95"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${getConfirmBtnClass()}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
