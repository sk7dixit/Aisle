import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFileExcel, FaUpload, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import BulkUploadStepper from './BulkUploadStepper';

const BulkProductAdd = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState(null); // To show preview after success

    const handleFileSelect = (e) => {
        setFile(e.target.files[0]);
        setError(null);
        setPreviewData(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://127.0.0.1:5000/api/seller/bulk-upload/init", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                setError(data.message || "Upload failed");
                return;
            }

            // Success: Show preview and/or redirect
            console.log("Upload Init Success:", data);
            setPreviewData(data);

            // Navigate to mapping with state
            setTimeout(() => {
                navigate(`/seller/add-product/bulk/mapping?uploadId=${data.uploadId}`, {
                    state: {
                        uploadId: data.uploadId,
                        headers: data.headers,
                        previewRows: data.previewRows
                    }
                });
            }, 1000);

        } catch (err) {
            console.error(err);
            setLoading(false);
            setError("Network error. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in-up p-6">
            <BulkUploadStepper currentStep={1} />
            <div className="flex items-center gap-4 mb-8">
                <Link to="/seller/products" className="p-3 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                    <FaArrowLeft />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-800">Bulk Upload (Excel)</h1>
                    <p className="text-slate-500 text-sm font-medium">Step 1: Upload your file</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Instructions */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm h-fit">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Instructions</h2>
                    <ul className="space-y-3 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            Supported formats: <code className="bg-slate-100 px-1 rounded text-slate-800">.xlsx</code>, <code className="bg-slate-100 px-1 rounded text-slate-800">.csv</code>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            First row must contain <strong>headers</strong>.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            Recommended columns:
                        </li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {["Product Name", "Price", "Unit", "Quantity"].map(col => (
                            <span key={col} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                                {col}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right: Upload Area */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center hover:border-indigo-400 transition-colors relative group">
                        <input
                            type="file"
                            accept=".xlsx,.csv"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            {file ? <FaFileExcel className="text-3xl" /> : <FaUpload className="text-3xl" />}
                        </div>
                        {file ? (
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{file.name}</h3>
                                <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Click to Upload</h3>
                                <p className="text-slate-400 text-sm mt-1">or drag and drop Excel file here</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-95
                            ${!file || loading
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        {loading ? <><FaSpinner className="animate-spin" /> Processing...</> : "Continue to Verification"}
                    </button>
                </div>
            </div>

            {/* Preview Section REMOVED per strict UX rules */}
        </div>
    );
};

export default BulkProductAdd;
