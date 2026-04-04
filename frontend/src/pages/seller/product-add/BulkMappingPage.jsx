import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaTriangleExclamation, FaArrowRight, FaWandMagicSparkles, FaTableList, FaCircleCheck, FaCircle } from 'react-icons/fa6';
import { useAuth } from '../../../context/AuthContext';
import BulkUploadStepper from './BulkUploadStepper';

const REQUIRED_FIELDS = [
    { id: 'name', label: 'Product Name', description: 'Used for AI categorization' },
    { id: 'price', label: 'Price', description: 'Selling price per unit' },
    { id: 'unit', label: 'Unit', description: 'Kg, Pc, Pkt, etc.' },
    { id: 'quantity', label: 'Stock Quantity', description: 'Current available stock' }
];

const BulkMappingPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const itemsLocation = useLocation();

    // State
    const [uploadId] = useState(searchParams.get('uploadId') || itemsLocation.state?.uploadId);
    const [headers] = useState(itemsLocation.state?.headers || []);
    const [previewRows] = useState(itemsLocation.state?.previewRows || []);

    // Initial State: EMPTY by default
    const [mapping, setMapping] = useState(() =>
        REQUIRED_FIELDS.reduce((acc, field) => {
            acc[field.id] = "";
            return acc;
        }, {})
    );

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    // Auto-Map on Mount (Silent & Conservative)
    useEffect(() => {
        if (!uploadId) {
            setError("Missing Upload ID. Please upload a file first.");
            setLoading(false);
            return;
        }

        const autoMap = async () => {
            try {
                const res = await fetch('http://127.0.0.1:5000/api/seller/bulk-upload/suggest-mapping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ uploadId })
                });

                const data = await res.json();
                if (res.ok && data.suggestions) {
                    console.log("Suggestions received but ignored as per 'EMPTY by default' requirement", data.suggestions);
                } else if (!res.ok) {
                    console.error("Auto-map failed:", data.message);
                }
            } catch (err) {
                console.error("Auto-map network error", err);
            } finally {
                setLoading(false);
            }
        };
        autoMap();
    }, [uploadId, token]);

    const handleMappingChange = (fieldId, excelHeader) => {
        setMapping(prev => {
            const updated = { ...prev };

            // If this column was already assigned to another field, clear that field
            Object.keys(updated).forEach(key => {
                if (updated[key] === excelHeader && excelHeader !== "") {
                    updated[key] = "";
                }
            });

            updated[fieldId] = excelHeader;
            return updated;
        });
    };

    const isAllMapped = () => {
        return (
            mapping.name &&
            mapping.price &&
            mapping.unit &&
            mapping.quantity &&
            mapping.price !== mapping.name // Basic sanity: name and price shouldn't be same column
        );
    };

    const handleContinue = async () => {
        if (processing) return;
        setProcessing(true);
        setError(null);

        try {
            // Transform mapping back to backend format { "Excel Header": "fieldId" } if needed
            // But let's check backend expectation. Backend expects { [header]: field }
            const backendMapping = {};
            Object.entries(mapping).forEach(([fieldId, header]) => {
                if (header) backendMapping[header] = fieldId;
            });

            const res = await fetch('http://127.0.0.1:5000/api/seller/bulk-upload/process-mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ uploadId, mapping: backendMapping })
            });

            const data = await res.json();

            if (res.ok) {
                navigate(`/seller/add-product/bulk/preview?uploadId=${uploadId}`, {
                    state: { products: data.products }
                });
            } else {
                setError(data.message || "Processing failed. Please check your mapping.");
            }
        } catch (err) {
            console.error("Processing Error:", err);
            setError("Connection lost. Please check your internet and try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading && !error) {
        return (
            <div className="max-w-4xl mx-auto p-20 text-center animate-pulse">
                <FaWandMagicSparkles className="text-6xl text-indigo-400 mx-auto mb-6 animate-bounce" />
                <h2 className="text-2xl font-black text-slate-800">Reading your file...</h2>
                <p className="text-slate-500">AI is analyzing columns and preparing verification table.</p>
            </div>
        );
    }

    if (error && !uploadId) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center">
                <div className="bg-red-50 text-red-600 p-8 rounded-3xl mb-8 border border-red-100">
                    <FaTriangleExclamation className="text-4xl mb-4 mx-auto" />
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-red-500/80">{error}</p>
                </div>
                <button onClick={() => navigate('/seller/add-product/bulk')} className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all">
                    Back to Upload
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-20 animate-fade-in-up p-6">
            <BulkUploadStepper currentStep={2} />

            {/* Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => navigate(-1)} className="p-3 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                            <FaArrowLeft />
                        </button>
                        <h1 className="text-3xl font-black text-slate-800">Column Mapping</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-14">
                        Match your Excel columns with ShopLens required fields. Our AI has pre-filled matches it found.
                    </p>
                </div>

                <div className="flex items-center justify-end">
                    <button
                        onClick={handleContinue}
                        disabled={!isAllMapped() || processing}
                        className={`group px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl
                            ${!isAllMapped() || processing
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 transform hover:-translate-y-1'
                            }`}
                    >
                        {processing ? (
                            <>
                                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Continue to Review <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-shake">
                    <FaTriangleExclamation className="shrink-0" />
                    <span className="font-bold text-sm">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Column Mapping Controls (Left Side) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <FaTableList className="text-indigo-600" />
                            <h2 className="font-black text-slate-800">Map Required Fields</h2>
                        </div>

                        <div className="space-y-6">
                            {REQUIRED_FIELDS.map((field) => {
                                const mappedValue = mapping[field.id] || "";
                                return (
                                    <div key={field.id} className="relative">
                                        <div className="flex justify-between items-end mb-2 px-1">
                                            <div>
                                                <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                                    {field.label}
                                                    {mappedValue ? <FaCircleCheck className="text-emerald-500" /> : <FaCircle className="text-slate-200" />}
                                                </label>
                                                <span className="text-[10px] text-slate-400 font-medium">{field.description}</span>
                                            </div>
                                        </div>
                                        <select
                                            value={mappedValue}
                                            onChange={(e) => handleMappingChange(field.id, e.target.value)}
                                            className={`w-full p-4 rounded-2xl bg-slate-50 border-2 font-bold transition-all appearance-none cursor-pointer
                                                ${mappedValue
                                                    ? 'border-emerald-100 text-slate-800'
                                                    : 'border-slate-100 text-slate-400 focus:border-indigo-400'
                                                }`}
                                        >
                                            <option value="">-- Select column --</option>
                                            {headers.map((h) => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-[42px] pointer-events-none text-slate-300">
                                            ▼
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!isAllMapped() && (
                            <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <FaTriangleExclamation className="text-amber-500 mt-1 shrink-0" />
                                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                    Please map all required fields correctly to continue. Check if your Excel has headers for Name, Price, Unit, and Quantity.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Preview (Right Side) */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[600px] flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-slate-700 text-sm">File Data Preview (First 20 rows)</h3>
                            <span className="text-[10px] font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-400 uppercase">
                                Read Only
                            </span>
                        </div>
                        <div className="overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr>
                                        <th className="px-4 py-4 bg-slate-50 font-black text-slate-400 border-b border-slate-100">#</th>
                                        {headers.map((h) => (
                                            <th key={h} className="px-4 py-4 bg-slate-50 font-black text-slate-800 border-b border-slate-100 whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {previewRows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-4 py-3 text-slate-300 font-medium border-r border-slate-50">{idx + 1}</td>
                                            {headers.map((h) => (
                                                <td key={h} className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                                                    {row[h] !== undefined && row[h] !== null ? String(row[h]) : <span className="text-slate-200 italic">-</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewRows.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                    <FaWandMagicSparkles className="text-4xl mb-4 opacity-20" />
                                    <p className="font-bold">No data found in uploaded file.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkMappingPage;
