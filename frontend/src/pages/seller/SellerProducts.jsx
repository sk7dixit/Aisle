import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaMicrophone,
    FaCamera,
    FaFileExcel,
    FaPen,
    FaDatabase,
    FaArrowRight,
    FaArrowLeft,
    FaBolt,
    FaLayerGroup,
    FaCommentDots,
    FaPlus,
    FaTrash,
    FaChevronLeft,
    FaChevronRight,
    FaCheck,
    FaSpinner,
    FaChevronDown,
    FaInfoCircle
} from 'react-icons/fa';
import AssistedListingModal from '../../components/seller/AssistedListingModal';
import ProductEditModal from '../../components/seller/ProductEditModal';

// Home Business categories
const HOME_BUSINESS_CATEGORIES = [
    { id: 'homemade-food', label: 'Homemade Food, Bakery & Catering', icon: '🍱' },
    { id: 'handmade-crafts', label: 'Handmade Arts, Crafts & Jewelry', icon: '🧶' },
    { id: 'tuition-coaching', label: 'Tuition, Coaching & Skill Classes', icon: '🎓' }
];

// Self-contained custom Tooltip component
const Tooltip = ({ text }) => {
    const [visible, setVisible] = useState(false);
    
    return (
        <span className="relative inline-block ml-1">
            <span
                onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                className="text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer text-xs align-middle inline-flex items-center"
            >
                <FaInfoCircle size={12} />
            </span>
            {visible && (
                <span className="absolute z-[99999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] leading-relaxed rounded-xl shadow-lg font-medium text-center after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900 transition-all animate-fade-in font-sans">
                    {text}
                </span>
            )}
        </span>
    );
};

const SellerProducts = () => {
    const { token, user } = useAuth();
    const [stats, setStats] = useState({ count: 0 });
    const [isAssistedModalOpen, setIsAssistedModalOpen] = useState(false);
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // Common inventory state
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Home Business specific wizard state
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardError, setWizardError] = useState('');
    const [submittingWizard, setSubmittingWizard] = useState(false);
    const [photoSource, setPhotoSource] = useState('upload'); // 'camera' or 'upload'

    // Wizard Form fields
    const [wizardForm, setWizardForm] = useState({
        name: '',
        categorySlug: 'homemade-food',
        description: '',
        productStory: '',
        homeBusinessType: 'READY_STOCK',
        unitType: 'Per Piece',
        customUnitType: '',
        price: '',
        quantity: '',
        preparationTime: '1 Day',
        customPreparationTime: '',
        isDraft: false
    });

    const [photos, setPhotos] = useState([]); // Array of { file: File, preview: string, type: 'front'|'other' }

    // Custom camera states & refs
    const [showCameraChecklist, setShowCameraChecklist] = useState(false);
    const [isCustomCameraActive, setIsCustomCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [currentCameraSlot, setCurrentCameraSlot] = useState('front'); // 'front' | 'side' | 'packaging' | 'closeup'
    const [cameraPreviewUrl, setCameraPreviewUrl] = useState(''); // Stores preview for the current capture review
    const [capturedPhotos, setCapturedPhotos] = useState({
        front: null,
        side: null,
        packaging: null,
        closeup: null
    });
    
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);

    // Camera Stream Management
    const startCamera = async (slot = 'front') => {
        try {
            setCurrentCameraSlot(slot);
            setCameraPreviewUrl('');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            setCameraStream(stream);
            setIsCustomCameraActive(true);
            
            // Assign stream to video element once active
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            console.error("Camera access error:", err);
            toast.error("Could not access rear camera. Please ensure permissions are granted, or choose to upload photos instead.");
            setIsCustomCameraActive(false);
            setShowCameraChecklist(false);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCustomCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Match canvas dimensions to video feed
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        // No mirroring (facingMode ideal environment)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const previewUrl = canvas.toDataURL('image/jpeg');
        setCameraPreviewUrl(previewUrl);
    };

    const keepPhoto = () => {
        if (!cameraPreviewUrl) return;
        
        // Convert dataURL to File
        fetch(cameraPreviewUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `creation_${currentCameraSlot}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                
                // Save to temporary capturedPhotos
                const updatedCaptured = {
                    ...capturedPhotos,
                    [currentCameraSlot]: { file, preview: cameraPreviewUrl }
                };
                setCapturedPhotos(updatedCaptured);
                
                // Determine next step
                advanceCameraSlot(updatedCaptured);
            });
    };

    const advanceCameraSlot = (currentCaptured) => {
        if (currentCameraSlot === 'front') {
            stopCamera();
            startCamera('side');
        } else if (currentCameraSlot === 'side') {
            stopCamera();
            startCamera('packaging');
        } else if (currentCameraSlot === 'packaging') {
            stopCamera();
            startCamera('closeup');
        } else if (currentCameraSlot === 'closeup') {
            finalizeCameraCaptures(currentCaptured);
        }
    };

    const skipCameraSlot = () => {
        const updatedCaptured = {
            ...capturedPhotos,
            [currentCameraSlot]: null
        };
        setCapturedPhotos(updatedCaptured);
        
        if (currentCameraSlot === 'side') {
            stopCamera();
            startCamera('packaging');
        } else if (currentCameraSlot === 'packaging') {
            stopCamera();
            startCamera('closeup');
        } else if (currentCameraSlot === 'closeup') {
            finalizeCameraCaptures(updatedCaptured);
        }
    };

    const finalizeCameraCaptures = (allPhotos) => {
        stopCamera();
        
        // Compile captured photos into the main `photos` array
        const compiledPhotos = [...photos]; // keep any existing photos if editing/adding more
        const slotsOrder = ['front', 'side', 'packaging', 'closeup'];
        
        slotsOrder.forEach(slot => {
            const photoData = allPhotos[slot];
            if (photoData) {
                // If there's an existing one of this type, we can replace or append.
                // For simplicity, we just push it
                compiledPhotos.push({
                    file: photoData.file,
                    preview: photoData.preview,
                    type: slot === 'front' && compiledPhotos.length === 0 ? 'front' : 'other'
                });
            }
        });
        
        setPhotos(compiledPhotos);
        setShowCameraChecklist(false);
        setIsCustomCameraActive(false);
        setCapturedPhotos({ front: null, side: null, packaging: null, closeup: null });
        
        // Go to Step 1 (review captured photos)
        setWizardStep(1);
    };

    const handleCloseCamera = () => {
        stopCamera();
        setShowCameraChecklist(false);
        setIsCustomCameraActive(false);
    };

    // Check user type
    const shopType = user?.shopDetails?.category || user?.shopDetails?.shopCategory || user?.shopDetails?.shopType || "";
    const isHomeBusiness = shopType === "Home Businesses" || shopType === "HOME_BUSINESS";

    // Fetch Stats & Products
    const fetchInventory = async () => {
        try {
            setLoadingProducts(true);
            // Fetch inventory metrics for count
            const metricsRes = await fetch('/api/seller/inventory/metrics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (metricsRes.ok) {
                const metricsData = await metricsRes.json();
                setStats({ count: metricsData.totalProducts || 0 });
            }

            // Fetch products list
            const productsRes = await fetch('/api/seller/inventory/products?category=All', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (productsRes.ok) {
                const productsData = await productsRes.json();
                setProducts(productsData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [token]);

    const progressValue = Math.min((stats.count / 120) * 100, 100);

    // Actions
    const handleDeleteProduct = (id) => {
        setConfirmState({
            isOpen: true,
            title: 'Delete Creation?',
            message: 'Are you sure you want to permanently delete this creation? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/seller/products/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setProducts(products.filter(p => p._id !== id));
                        fetchInventory();
                        toast.success("Creation deleted successfully!");
                    } else {
                        toast.error("Failed to delete creation");
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("An error occurred while deleting");
                }
            }
        });
    };

    const handleToggleAvailability = async (product) => {
        try {
            const newAvailability = !product.isAvailable;
            const res = await fetch(`/api/seller/products/${product._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAvailable: newAvailability })
            });
            if (res.ok) {
                const updated = await res.json();
                setProducts(products.map(p => p._id === product._id ? { ...p, isAvailable: updated.isAvailable } : p));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedProduct = async (id, updatedData) => {
        try {
            const isFormData = updatedData instanceof FormData;
            const headers = { 'Authorization': `Bearer ${token}` };
            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }
            const res = await fetch(`/api/seller/products/${id}`, {
                method: 'PUT',
                headers,
                body: isFormData ? updatedData : JSON.stringify(updatedData)
            });
            if (res.ok) {
                fetchInventory();
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Wizard functions
    const handleAddPhotos = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newPhotos = [...photos];
        let addedCount = 0;

        files.forEach(file => {
            if (newPhotos.length < 8) {
                const photoObj = {
                    file: file,
                    preview: '',
                    type: newPhotos.length === 0 ? 'front' : 'other'
                };
                newPhotos.push(photoObj);
                addedCount++;

                const reader = new FileReader();
                reader.onloadend = () => {
                    photoObj.preview = reader.result;
                    setPhotos([...newPhotos]);
                };
                reader.readAsDataURL(file);
            }
        });

        if (addedCount > 0) {
            setPhotos(newPhotos);
            if (wizardStep === 0) {
                setWizardStep(1);
            }
        }
    };

    const handleRemovePhoto = (index, e) => {
        e?.stopPropagation();
        const updated = photos.filter((_, i) => i !== index);
        if (updated.length > 0) {
            updated[0].type = 'front';
        }
        setPhotos(updated);
    };

    const handleWizardSubmit = async (saveAsDraft = false) => {
        setWizardError('');
        
        // Validations
        if (wizardStep === 1 && photos.length === 0) {
            setWizardError('Please capture or upload at least one photo.');
            return;
        }
        if (wizardStep === 2 && !wizardForm.name) {
            setWizardError('Creation Name is required.');
            return;
        }
        if (wizardStep === 3) {
            if (!wizardForm.price) {
                setWizardError('Price is required.');
                return;
            }
            if (wizardForm.homeBusinessType === 'READY_STOCK' && !wizardForm.quantity) {
                setWizardError('Available quantity is required for Ready Stock.');
                return;
            }
        }

        // If not on final step, just advance
        if (wizardStep < 4) {
            setWizardStep(wizardStep + 1);
            return;
        }

        // Submit form
        setSubmittingWizard(true);
        try {
            const formData = new FormData();
            formData.append('name', wizardForm.name);
            formData.append('sellingPrice', wizardForm.price);
            formData.append('mrp', wizardForm.price);
            formData.append('description', wizardForm.description);
            
            const selectedCat = HOME_BUSINESS_CATEGORIES.find(c => c.id === wizardForm.categorySlug);
            formData.append('categorySlug', wizardForm.categorySlug);
            formData.append('category', selectedCat?.label || 'Other');
            formData.append('subCategory', selectedCat?.label || 'Other');
            
            const unit = wizardForm.unitType === 'Custom' ? wizardForm.customUnitType : wizardForm.unitType;
            formData.append('unit', unit);
            formData.append('homeBusinessType', wizardForm.homeBusinessType);
            
            if (wizardForm.homeBusinessType === 'READY_STOCK') {
                formData.append('quantity', wizardForm.quantity);
            } else {
                formData.append('quantity', 0);
                const prepTime = wizardForm.preparationTime === 'Custom' ? wizardForm.customPreparationTime : wizardForm.preparationTime;
                formData.append('preparationTime', prepTime);
            }
            
            formData.append('productStory', wizardForm.productStory);
            formData.append('isDraft', saveAsDraft);

            // Append photos
            photos.forEach(photo => {
                if (photo.file) {
                    formData.append('images', photo.file);
                }
            });

            const res = await fetch('/api/seller/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to publish creation');
            }

            // Reset and close
            setIsWizardOpen(false);
            setWizardStep(0);
            setPhotos([]);
            setWizardForm({
                name: '',
                categorySlug: 'homemade-food',
                description: '',
                productStory: '',
                homeBusinessType: 'READY_STOCK',
                unitType: 'Per Piece',
                customUnitType: '',
                price: '',
                quantity: '',
                preparationTime: '1 Day',
                customPreparationTime: '',
                isDraft: false
            });
            fetchInventory();
        } catch (e) {
            setWizardError(e.message);
        } finally {
            setSubmittingWizard(false);
        }
    };

    // Render Home Business dashboard
    if (isHomeBusiness) {
        // Filter creations
        const readyStock = products.filter(p => p.homeBusinessType === 'READY_STOCK' && !p.isDraft);
        const madeToOrder = products.filter(p => p.homeBusinessType === 'MADE_TO_ORDER' && !p.isDraft);
        const drafts = products.filter(p => p.isDraft);

        return (
            <div className="max-w-7xl mx-auto px-6 pb-24 pt-4 animate-fade-in font-sans">
                {/* Modals */}
                <ProductEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    product={selectedProduct}
                    onSave={handleSaveEditedProduct}
                    shopType="HOME_BUSINESS"
                />

                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            🌸 My Creations <span className="text-sm bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full font-bold">{stats.count} Total</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-base mt-1">
                            Showcase and manage your handcrafted masterpieces.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Progress Bar */}
                        <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200/60 hidden sm:flex items-center gap-3">
                            <div className="text-xs font-black text-slate-500">
                                Shelf Space: {stats.count}/120
                            </div>
                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressValue}%` }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsWizardOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-2"
                        >
                            <FaPlus className="text-xs" /> Create New Creation
                        </button>
                    </div>
                </div>

                {/* Creations List */}
                {loadingProducts ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <FaSpinner className="text-indigo-600 text-3xl animate-spin" />
                        <span className="text-slate-400 font-bold text-sm">Loading your masterpieces...</span>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center max-w-xl mx-auto mt-10">
                        <div className="text-5xl mb-4">🎨</div>
                        <h2 className="text-xl font-black text-slate-900 mb-2">No Creations Yet</h2>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            Start listing your handmade recipes, pickles, bags, cakes, or gifts. Connect directly with buyers who appreciate artisan items.
                        </p>
                        <button
                            onClick={() => setIsWizardOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all"
                        >
                            + Create First Creation
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* 📦 Section 1: Ready Stock */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <span className="text-2xl">📦</span>
                                <h2 className="text-lg font-black text-slate-900">Ready Stock</h2>
                                <span className="text-xs bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">{readyStock.length} Creations</span>
                            </div>
                            {readyStock.length === 0 ? (
                                <p className="text-slate-400 text-sm font-medium italic py-2">No items listed under Ready Stock.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {readyStock.map(p => <CreationCard key={p._id} product={p} onDelete={handleDeleteProduct} onToggleAvailability={handleToggleAvailability} onEdit={handleEditProduct} />)}
                                </div>
                            )}
                        </div>

                        {/* 🛠️ Section 2: Made To Order */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <span className="text-2xl">🎂</span>
                                <h2 className="text-lg font-black text-slate-900">Made To Order</h2>
                                <span className="text-xs bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full">{madeToOrder.length} Creations</span>
                            </div>
                            {madeToOrder.length === 0 ? (
                                <p className="text-slate-400 text-sm font-medium italic py-2">No items listed under Made To Order.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {madeToOrder.map(p => <CreationCard key={p._id} product={p} onDelete={handleDeleteProduct} onToggleAvailability={handleToggleAvailability} onEdit={handleEditProduct} />)}
                                </div>
                            )}
                        </div>

                        {/* 📝 Section 3: Draft Creations */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <span className="text-2xl">📝</span>
                                <h2 className="text-lg font-black text-slate-900">Draft Creations</h2>
                                <span className="text-xs bg-slate-500/10 text-slate-600 font-bold px-2 py-0.5 rounded-full">{drafts.length} Creations</span>
                            </div>
                            {drafts.length === 0 ? (
                                <p className="text-slate-400 text-sm font-medium italic py-2">No draft creations.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {drafts.map(p => <CreationCard key={p._id} product={p} onDelete={handleDeleteProduct} onToggleAvailability={handleToggleAvailability} onEdit={handleEditProduct} />)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Guided Multi-Step Wizard Modal --- */}
                {isWizardOpen && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                            {/* Header */}
                            {(!isCustomCameraActive && !showCameraChecklist) && (
                                <div className="px-6 py-4 bg-gradient-to-r from-indigo-500/5 via-indigo-500/10 to-indigo-500/5 border-b border-slate-100 flex justify-between items-center shrink-0">
                                    <div>
                                        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                            ✨ Create New Creation
                                        </h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            {wizardStep === 0 ? 'Choose Source' : `Step ${wizardStep} of 4`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setConfirmState({
                                                isOpen: true,
                                                title: 'Discard Creation?',
                                                message: 'Are you sure you want to close the creator wizard? Any unsaved edits will be lost.',
                                                onConfirm: () => {
                                                    setIsWizardOpen(false);
                                                    setWizardStep(0);
                                                    setPhotos([]);
                                                    stopCamera();
                                                    setShowCameraChecklist(false);
                                                }
                                            });
                                        }}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Hidden inputs for camera capture & file upload */}
                            <input
                                type="file"
                                id="wizard-camera-input"
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handleAddPhotos}
                            />
                            <input
                                type="file"
                                id="wizard-upload-input"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleAddPhotos}
                            />

                            {/* Wizard Progress Line */}
                            {(!isCustomCameraActive && !showCameraChecklist) && (
                                <div className="h-1.5 w-full bg-slate-100 shrink-0">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-300"
                                        style={{ width: `${(wizardStep / 4) * 100}%` }}
                                    />
                                </div>
                            )}

                            {/* Body (Scrollable) */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {wizardError && (
                                    <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-100 animate-fade-in">
                                        {wizardError}
                                    </div>
                                )}

                                {/* PHOTOGRAPHY CHECKLIST */}
                                {showCameraChecklist && (
                                    <div className="space-y-6 animate-fade-in py-4">
                                        <div className="text-center space-y-1">
                                            <h4 className="font-extrabold text-slate-800 text-base flex items-center justify-center gap-2">
                                                📸 Photography Checklist
                                            </h4>
                                            <p className="text-xs text-slate-400 font-semibold">Make your creation look professional with these simple tips.</p>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4 max-w-sm mx-auto">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block border-b border-slate-100 pb-2">Before Taking Photos</span>
                                            <ul className="space-y-3 text-xs text-slate-600 font-bold">
                                                <li className="flex items-center gap-3">
                                                    <span className="text-emerald-500 text-sm">✓</span> Clean the product surface
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <span className="text-emerald-500 text-sm">✓</span> Ensure bright, natural lighting
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <span className="text-emerald-500 text-sm">✓</span> Use a plain or solid background
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <span className="text-emerald-500 text-sm">✓</span> Keep your creation centered
                                                </li>
                                                <li className="flex items-center gap-3">
                                                    <span className="text-emerald-500 text-sm">✓</span> Have your packaging ready for a shot
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="flex gap-3 justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowCameraChecklist(false)}
                                                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCameraChecklist(false);
                                                    startCamera('front');
                                                }}
                                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition-colors"
                                            >
                                                Start Camera
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* CUSTOM CAMERA UI */}
                                {isCustomCameraActive && (
                                    <div className="space-y-4 animate-fade-in flex flex-col items-center py-4">
                                        <div className="text-center space-y-1 w-full">
                                            <div className="flex items-center justify-between px-2">
                                                <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider">
                                                    Slot: {currentCameraSlot === 'front' ? 'Front View (Required)' : 
                                                           currentCameraSlot === 'side' ? 'Side View (Optional)' :
                                                           currentCameraSlot === 'packaging' ? 'Packaging (Optional)' :
                                                           'Close-up Detail (Optional)'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleCloseCamera}
                                                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 text-sm"
                                                    title="Close Camera"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            
                                            <p className="text-xs text-slate-500 font-bold px-4 pt-1">
                                                {currentCameraSlot === 'front' && 'Capture the main view of the item clearly. This will be the cover image.'}
                                                {currentCameraSlot === 'side' && 'Show the thickness, height, or alternate angles. Shoot from a 45° angle.'}
                                                {currentCameraSlot === 'packaging' && 'Show how the customer receives your item. Include wrapping or labels.'}
                                                {currentCameraSlot === 'closeup' && 'Focus on texture, stitching, raw ingredients, or craftsmanship.'}
                                            </p>
                                        </div>

                                        {/* Camera Live Stream or Preview Image */}
                                        <div className="relative aspect-video w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
                                            {!cameraPreviewUrl ? (
                                                <>
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        className="w-full h-full object-cover"
                                                        style={{ transform: 'none' }} // Ensure no mirror image
                                                    />
                                                    {/* Grid lines overlay */}
                                                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                                                        <div className="border-r border-b border-white"></div>
                                                        <div className="border-r border-b border-white"></div>
                                                        <div className="border-b border-white"></div>
                                                        <div className="border-r border-b border-white"></div>
                                                        <div className="border-r border-b border-white"></div>
                                                        <div className="border-b border-white"></div>
                                                        <div className="border-r border-white"></div>
                                                        <div className="border-r border-white"></div>
                                                        <div></div>
                                                    </div>
                                                </>
                                            ) : (
                                                <img
                                                    src={cameraPreviewUrl}
                                                    alt="Capture Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>

                                        {/* Hidden canvas for capturing */}
                                        <canvas ref={canvasRef} className="hidden" />

                                        {/* Camera Controls */}
                                        <div className="w-full max-w-sm pt-2 flex justify-center items-center gap-4">
                                            {!cameraPreviewUrl ? (
                                                <>
                                                    {currentCameraSlot !== 'front' && (
                                                        <button
                                                            type="button"
                                                            onClick={skipCameraSlot}
                                                            className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                                                        >
                                                            Skip Slot
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={capturePhoto}
                                                        className="w-14 h-14 bg-white border-4 border-indigo-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all hover:bg-indigo-50"
                                                        title="Capture Photo"
                                                    >
                                                        <div className="w-8 h-8 bg-indigo-600 rounded-full" />
                                                    </button>

                                                    {currentCameraSlot !== 'front' && <div className="flex-1" />}
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCameraPreviewUrl('')}
                                                        className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                                                    >
                                                        Retake
                                                    </button>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={keepPhoto}
                                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-100"
                                                    >
                                                        {currentCameraSlot === 'closeup' ? 'Finish capturing' : 'Keep & Next'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 0: Choose Source */}
                                {(!isCustomCameraActive && !showCameraChecklist && wizardStep === 0) && (
                                    <div className="space-y-6">
                                        <div className="text-center space-y-1">
                                            <h4 className="font-extrabold text-slate-800 text-base">Add Creation Photos</h4>
                                            <p className="text-xs text-slate-400 font-semibold">Choose how you want to add photos for your creation.</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Option 1: Use Camera */}
                                            <div 
                                                onClick={() => {
                                                    setPhotoSource('camera');
                                                    setShowCameraChecklist(true);
                                                }}
                                                className="p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/20 hover:border-indigo-300 cursor-pointer text-center space-y-3 transition-all flex flex-col items-center justify-center group"
                                            >
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-500 text-lg group-hover:scale-110 transition-transform">
                                                    📷
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-slate-800 text-sm">Take Photos Now</h5>
                                                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Capture fresh photos of your product using your camera.</p>
                                                </div>
                                                <button type="button" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] shadow-md shadow-indigo-100 transition-colors">
                                                    Open Camera
                                                </button>
                                            </div>

                                            {/* Option 2: Upload Files */}
                                            <div 
                                                onClick={() => {
                                                    setPhotoSource('upload');
                                                    document.getElementById('wizard-upload-input').click();
                                                }}
                                                className="p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/20 hover:border-indigo-300 cursor-pointer text-center space-y-3 transition-all flex flex-col items-center justify-center group"
                                            >
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-500 text-lg group-hover:scale-110 transition-transform">
                                                    🖼
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-slate-800 text-sm">Upload Existing Photos</h5>
                                                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Select existing photos of your creation from your device gallery.</p>
                                                </div>
                                                <button type="button" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] shadow-md shadow-indigo-100 transition-colors">
                                                    Upload Images
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 1: Capture or Upload Photos */}
                                {(!isCustomCameraActive && !showCameraChecklist && wizardStep === 1) && (
                                    <div className="space-y-6">
                                        <div className="text-center space-y-1">
                                            <h4 className="font-extrabold text-slate-800 text-base">Capture Creation Photos</h4>
                                            <p className="text-xs text-slate-400 font-semibold">You can add up to 8 photos. First photo is used as the cover.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {photos.length === 0 ? (
                                                <div 
                                                    onClick={() => {
                                                        if (photoSource === 'camera') {
                                                            setShowCameraChecklist(true);
                                                        } else {
                                                            document.getElementById('wizard-upload-input').click();
                                                        }
                                                    }}
                                                    className="h-48 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 cursor-pointer flex flex-col items-center justify-center gap-2 p-4 text-center transition-all group"
                                                >
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-transform">
                                                        📷
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 text-xs flex items-center justify-center gap-1">
                                                            Add Cover Photo (Required)
                                                            <Tooltip text="This photo will be shown first to customers. Capture the entire product clearly." />
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Click to capture or upload your main creation photo.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Cover photo preview */}
                                                    <div className="relative rounded-2xl border border-slate-200 overflow-hidden aspect-video bg-slate-100 shadow-inner">
                                                        <img src={photos[0].preview} alt="Cover Preview" className="w-full h-full object-cover" />
                                                        <span className="absolute bottom-3 left-3 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                                                            Cover Photo / Front View
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleRemovePhoto(0, e)}
                                                            className="absolute top-3 right-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs shadow-md transition-colors"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>

                                                    {/* Gallery Thumbnails list */}
                                                    {photos.length > 1 && (
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Gallery Images ({photos.length - 1}/7)</span>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {photos.slice(1).map((photo, idx) => (
                                                                    <div key={idx + 1} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group shadow-sm">
                                                                        <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleRemovePhoto(idx + 1, e)}
                                                                            className="absolute inset-0 bg-rose-500/90 text-white flex items-center justify-center font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Dynamic add options */}
                                                    {photos.length < 8 && (
                                                        <div className="pt-2">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Add More Photos</span>
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {[
                                                                    { label: '+ Add Side View', type: 'side', tooltip: 'Show thickness and dimensions. Capture from 45° angle.' },
                                                                    { label: '+ Add Packaging', type: 'packaging', tooltip: 'Show how customer receives product. Include box, wrapping, labels.' },
                                                                    { label: '+ Add Close-Up', type: 'closeup', tooltip: 'Show texture, details and craftsmanship. Focus on quality.' },
                                                                    { label: '+ Add Photo', type: 'other', tooltip: 'Add any other relevant photo of your creation.' }
                                                                ].map((btn, i) => (
                                                                    <div key={i} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl pr-2 hover:bg-slate-100 transition-colors shadow-sm">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (photoSource === 'camera') {
                                                                                    startCamera(btn.type);
                                                                                } else {
                                                                                    document.getElementById('wizard-upload-input').click();
                                                                                }
                                                                            }}
                                                                            className="px-3 py-2 text-slate-600 rounded-l-xl text-[10px] font-bold transition-all"
                                                                        >
                                                                            {btn.label}
                                                                        </button>
                                                                        <Tooltip text={btn.tooltip} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Basic Details */}
                                {wizardStep === 2 && (
                                    <div className="space-y-5">
                                        <div className="text-center space-y-1">
                                            <h4 className="font-extrabold text-slate-800 text-base">Story & Classification</h4>
                                            <p className="text-xs text-slate-400 font-medium">Tell customers about the inspiration and origin of your creation.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Name */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Creation Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Grandma's Mango Pickle"
                                                    value={wizardForm.name}
                                                    onChange={(e) => setWizardForm({ ...wizardForm, name: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-bold text-slate-800"
                                                />
                                            </div>

                                            {/* Category */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                                                <div className="relative">
                                                    <select
                                                        value={wizardForm.categorySlug}
                                                        onChange={(e) => setWizardForm({ ...wizardForm, categorySlug: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-bold text-slate-800 appearance-none cursor-pointer"
                                                    >
                                                        {HOME_BUSINESS_CATEGORIES.map(c => (
                                                            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                                        ))}
                                                    </select>
                                                    <FaChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={10} />
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                                                <textarea
                                                    rows="3"
                                                    placeholder="Describe your creation, ingredients, materials used, etc."
                                                    value={wizardForm.description}
                                                    onChange={(e) => setWizardForm({ ...wizardForm, description: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-xs font-semibold text-slate-600 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Selling Parameters */}
                                {wizardStep === 3 && (
                                    <div className="space-y-5">
                                        <div className="text-center space-y-1">
                                            <h4 className="font-extrabold text-slate-800 text-base">Selling Details</h4>
                                            <p className="text-xs text-slate-400 font-medium">Configure how you distribute and charge for this creation.</p>
                                        </div>

                                        <div className="space-y-5">
                                            {/* Product Type (Radio buttons) */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Production Type</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div
                                                        onClick={() => setWizardForm({ ...wizardForm, homeBusinessType: 'READY_STOCK' })}
                                                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1
                                                            ${wizardForm.homeBusinessType === 'READY_STOCK'
                                                                ? 'border-indigo-600 bg-indigo-50/20 text-indigo-950'
                                                                : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500'
                                                            }`}
                                                    >
                                                        <span className="text-lg">📦</span>
                                                        <span className="text-xs font-black">Ready Stock</span>
                                                        <span className="text-[9px] opacity-70 leading-tight">Available immediately</span>
                                                    </div>

                                                    <div
                                                        onClick={() => setWizardForm({ ...wizardForm, homeBusinessType: 'MADE_TO_ORDER' })}
                                                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1
                                                            ${wizardForm.homeBusinessType === 'MADE_TO_ORDER'
                                                                ? 'border-indigo-600 bg-indigo-50/20 text-indigo-950'
                                                                : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500'
                                                            }`}
                                                    >
                                                        <span className="text-lg">🎂</span>
                                                        <span className="text-xs font-black">Made To Order</span>
                                                        <span className="text-[9px] opacity-70 leading-tight">Prepared after receiving order</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price & Unit Type Row */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="250"
                                                        value={wizardForm.price}
                                                        onChange={(e) => setWizardForm({ ...wizardForm, price: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-bold text-slate-800"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unit Type</label>
                                                    <div className="relative">
                                                        <select
                                                            value={wizardForm.unitType}
                                                            onChange={(e) => setWizardForm({ ...wizardForm, unitType: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-bold text-slate-800 appearance-none cursor-pointer"
                                                        >
                                                            {['Per Piece', 'Per Box', 'Per Kg', 'Per Gram', 'Per Packet', 'Per Bottle', 'Per Set', 'Custom'].map(u => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ))}
                                                        </select>
                                                        <FaChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={10} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Custom Unit Field */}
                                            {wizardForm.unitType === 'Custom' && (
                                                <div className="space-y-1.5 animate-fade-in">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Specify Unit</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Per Plate, Per Jar"
                                                        value={wizardForm.customUnitType}
                                                        onChange={(e) => setWizardForm({ ...wizardForm, customUnitType: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-bold text-slate-800"
                                                    />
                                                </div>
                                            )}

                                            {/* Quantity OR Prep Time */}
                                            {wizardForm.homeBusinessType === 'READY_STOCK' ? (
                                                <div className="space-y-1.5 animate-fade-in">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Stock (Qty)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 18"
                                                        value={wizardForm.quantity}
                                                        onChange={(e) => setWizardForm({ ...wizardForm, quantity: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-bold text-slate-800"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                                    <div className="space-y-1.5 col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Preparation Time</label>
                                                        <div className="relative">
                                                            <select
                                                                 value={wizardForm.preparationTime}
                                                                 onChange={(e) => setWizardForm({ ...wizardForm, preparationTime: e.target.value })}
                                                                 className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-bold text-slate-800 appearance-none cursor-pointer"
                                                            >
                                                                {['1 Day', '2 Days', '3 Days', '5 Days', 'Custom'].map(t => (
                                                                    <option key={t} value={t}>{t}</option>
                                                                ))}
                                                            </select>
                                                            <FaChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={10} />
                                                        </div>
                                                    </div>

                                                    {wizardForm.preparationTime === 'Custom' && (
                                                        <div className="space-y-1.5 col-span-2 animate-fade-in">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Specify Time</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 2-3 Days, 1 Week"
                                                                value={wizardForm.customPreparationTime}
                                                                onChange={(e) => setWizardForm({ ...wizardForm, customPreparationTime: e.target.value })}
                                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-bold text-slate-800"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: Story & Publish */}
                                {wizardStep === 4 && (
                                    <div className="space-y-5">
                                        <div className="text-center space-y-1">
                                            <h4 className="font-extrabold text-slate-800 text-base">Story & Publish</h4>
                                            <p className="text-xs text-slate-400 font-medium">Add a personal touch by sharing the story of this handcrafted item.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Story Box */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">The Creation Story (Optional)</label>
                                                    <span className="text-[9px] text-indigo-500 font-extrabold">Highly Recommended!</span>
                                                </div>
                                                <textarea
                                                    rows="4"
                                                    placeholder="e.g. prepared using my grandmother's traditional family recipe from Jaipur, using organic ingredients..."
                                                    value={wizardForm.productStory}
                                                    onChange={(e) => setWizardForm({ ...wizardForm, productStory: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-300 outline-none transition-all text-xs font-semibold text-slate-600 resize-none"
                                                />
                                            </div>

                                            {/* Preview Summary */}
                                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Quick Preview Summary</span>
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
                                                        {photos[0]?.preview ? (
                                                            <img src={photos[0].preview} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">🍱</div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1 flex-1">
                                                        <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                                                            {wizardForm.homeBusinessType === 'READY_STOCK' ? 'Ready Stock' : 'Made To Order'}
                                                        </span>
                                                        <h5 className="font-extrabold text-slate-900 text-sm leading-none">{wizardForm.name || 'Untitled Creation'}</h5>
                                                        <p className="text-xs font-black text-slate-500">₹{wizardForm.price || '0'} / {wizardForm.unitType === 'Custom' ? wizardForm.customUnitType : wizardForm.unitType}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {(!isCustomCameraActive && !showCameraChecklist) && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                                    <button
                                        onClick={() => wizardStep > 0 && setWizardStep(wizardStep - 1)}
                                        disabled={wizardStep === 0}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wide border transition-all
                                            ${wizardStep === 0
                                                ? 'bg-transparent text-slate-300 border-slate-100 cursor-not-allowed'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        Back
                                    </button>

                                    <div className="flex gap-2">
                                        {wizardStep === 4 && (
                                            <button
                                                onClick={() => handleWizardSubmit(true)}
                                                disabled={submittingWizard}
                                                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                            >
                                                Save as Draft
                                            </button>
                                        )}

                                        {wizardStep > 0 && (
                                            <button
                                                onClick={() => handleWizardSubmit(false)}
                                                disabled={submittingWizard}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all flex items-center gap-1.5"
                                            >
                                                {submittingWizard ? (
                                                    <>
                                                        <FaSpinner className="animate-spin text-xs" /> Processing...
                                                    </>
                                                ) : wizardStep === 4 ? (
                                                    <>
                                                        <FaCheck className="text-xs" /> Publish
                                                    </>
                                                ) : (
                                                    <>
                                                        Next <FaArrowRight className="text-xs" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <ConfirmModal 
                    isOpen={confirmState.isOpen}
                    title={confirmState.title}
                    message={confirmState.message}
                    onConfirm={confirmState.onConfirm}
                    onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                />
            </div>
        );
    }

    // Default Retail layout for grocery/electronics/etc.
    return (
        <div className="max-w-7xl mx-auto px-6 pb-24 pt-4 animate-fade-in font-sans">
            <AssistedListingModal
                isOpen={isAssistedModalOpen}
                onClose={() => setIsAssistedModalOpen(false)}
            />

            {/* Header Section */}
            <div className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight animate-fade-in-up">
                        Let's add products to your shop <span className="ml-2 inline-block animate-wave">👋</span>
                    </h1>

                    {/* Progress Pill */}
                    <div className="bg-slate-100 rounded-full px-4 py-1.5 flex items-center gap-3">
                        <div className="text-[10px] font-bold text-slate-400">
                            {stats.count} / 120
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressValue}%` }}
                            />
                        </div>
                    </div>
                </div>
                <p className="text-slate-500 font-medium text-lg animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                    Choose a method below. You can switch anytime — we'll help you at every step.
                </p>
            </div>

            {/* Recommended Section */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-50 p-1.5 rounded-md text-blue-600">
                        <FaBolt size={12} />
                    </div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                        RECOMMENDED (FASTEST)
                    </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* 1. Add by Voice */}
                    <Link to="/seller/add-product/voice" className="group relative bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-4 right-4">
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                SMART SYNC
                            </span>
                        </div>
                        <div className="mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-base mb-2">
                                <FaMicrophone />
                            </div>
                            <h3 className="text-base font-black text-slate-900 mb-1">Add by Voice</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-sm mb-2">
                                Just speak product names and prices. High-quality listings are created for you instantly.
                            </p>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                                Start Voice Listing <FaArrowRight />
                            </div>
                        </div>
                    </Link>

                    {/* 2. Add by Images (Smart Scan) */}
                    <Link to="/seller/image-listing" className="group relative bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-purple-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-4 right-4">
                            <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                SMART SCAN
                            </span>
                        </div>
                        <div className="mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-base mb-2">
                                <FaCamera />
                            </div>
                            <h3 className="text-base font-black text-slate-900 mb-1">Add by Images</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-sm mb-2">
                                Click product photos or shelf images. Detection, categorization, and pricing happen automatically.
                            </p>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                                Upload Images <FaArrowRight />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Structured Methods Section */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-slate-100 p-1.5 rounded-md text-slate-600">
                        <FaLayerGroup size={12} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        STRUCTURED METHODS
                    </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {/* 3. Bulk Upload */}
                    <Link to="/seller/add-product/bulk" className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base mb-2">
                            <FaFileExcel />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">Bulk Upload (Excel)</h3>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-2 min-h-[30px]">
                            Upload many products at once using a spreadsheet.
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                            UPLOAD EXCEL <FaArrowRight />
                        </div>
                    </Link>

                    {/* 4. Add Manually */}
                    <Link to="/seller/add-product/manual" className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-amber-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-base mb-2">
                            <FaPen />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">Add Manually</h3>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-2 min-h-[30px]">
                            Add products one by one with full control and preview.
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                            START MANUALLY <FaArrowRight />
                        </div>
                    </Link>

                    {/* 5. Match Catalog */}
                    <Link to="/seller/product-add/catalog" className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base mb-2">
                            <FaDatabase />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">Match Catalog</h3>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-2 min-h-[30px]">
                            Select products already on Aisle and set your price.
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                            BROWSE CATALOG <FaArrowRight />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Assistance Banner */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start gap-6 relative z-10">
                    <div className="bg-slate-900 text-white rounded-2xl w-14 h-14 flex items-center justify-center text-2xl shadow-lg shadow-slate-200">
                        <FaCommentDots />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Need help? We'll do it for you.</h3>
                        <p className="text-slate-500 font-medium max-w-lg text-sm leading-relaxed mb-3">
                            If you're short on time or facing issues, our dedicated team will visit your
                            shop or take your list and populate your Aisle shelf for you.
                        </p>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            PAID SERVICE • VERIFIED BY AISLE PROFESSIONALS
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsAssistedModalOpen(true)}
                    className="relative z-10 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-slate-200/50 transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                    REQUEST ASSISTED LISTING
                </button>
            </div>
            <ConfirmModal 
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

// --- Helper Component: The Creation Card with multi-photo gallery ---
const CreationCard = ({ product, onDelete, onToggleAvailability, onEdit }) => {
    const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl || 'https://via.placeholder.com/150'];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const getFullUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/150';
        if (path.startsWith('data:') || path.startsWith('http')) return path;
        return `/${path}`;
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((currentImageIndex + 1) % images.length);
    };

    const handlePrevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length);
    };

    return (
        <div className={`bg-white rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative ${!product.isAvailable ? 'opacity-60' : ''}`}>
            
            {/* Status indicators */}
            <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
                {product.isDraft && (
                    <span className="bg-slate-800 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                        Draft
                    </span>
                )}
                {!product.isAvailable && (
                    <span className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                        Paused
                    </span>
                )}
            </div>

            {/* Media/Gallery Area */}
            <div className="relative aspect-video w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                <img
                    src={getFullUrl(images[currentImageIndex])}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                />

                {/* Arrow Controls for Multi-Photo */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                            <FaChevronLeft size={10} />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                            <FaChevronRight size={10} />
                        </button>

                        {/* Dot Indicators */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                            {images.map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-3' : 'bg-white/40'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Content Info */}
            <div className="p-5 flex-1 flex flex-col space-y-4">
                <div className="flex-1 space-y-1.5">
                    <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        {product.subCategory || product.category}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {product.name}
                    </h3>
                    
                    {/* Price and Stock/Prep Info */}
                    <div className="flex items-center justify-between pt-1">
                        <span className="font-black text-slate-900 text-lg leading-none">
                            ₹{product.sellingPrice} <span className="text-[10px] text-slate-400 font-bold">/ {product.unit}</span>
                        </span>

                        {product.homeBusinessType === 'READY_STOCK' ? (
                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                Qty: {product.quantity}
                            </span>
                        ) : (
                            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                🕒 {product.preparationTime || '1 Day'} Prep
                            </span>
                        )}
                    </div>
                </div>

                {/* Product Story Box */}
                {product.productStory && (
                    <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-3 text-[10px] text-slate-500 font-medium italic leading-relaxed shrink-0">
                        "{product.productStory}"
                    </div>
                )}

                {/* Card Action Drawer */}
                <div className="flex gap-2 border-t border-slate-100 pt-3.5 shrink-0">
                    <button
                        onClick={() => onEdit(product)}
                        className="flex-1 py-2 text-center text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
                    >
                        Edit
                    </button>
                    
                    {!product.isDraft && (
                        <button
                            onClick={() => onToggleAvailability(product)}
                            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all
                                ${product.isAvailable
                                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                    : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                        >
                            {product.isAvailable ? 'Pause' : 'Resume'}
                        </button>
                    )}

                    <button
                        onClick={() => onDelete(product._id)}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all"
                        title="Delete Product"
                    >
                        <FaTrash size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Helper Component: The Custom Confirm Modal ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans animate-duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 text-xl font-bold">
                        ⚠️
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs shadow-lg shadow-indigo-100"
                    >
                        Yes, Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SellerProducts;
