import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMicrophone, FaArrowRight, FaArrowLeft, FaCheck, FaTrash, FaExclamationTriangle, FaCamera, FaUpload } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES, getCategoriesForShop } from "@/constants/categories";
import { CATEGORY_IMAGE_MAP, PRODUCT_IMAGE_MAP } from "@/utils/categoryImageMap";

// --- STEP 1: VoiceInstructions ---
// --- STEP 1: VoiceInstructions (Redesigned: No Scroll) ---
const VoiceInstructions = ({ onStart }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="voice-instructions-container flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full"
        >

            {/* Split Layout Card */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">

                {/* LEFT: Compact Instructions */}
                <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">1</span>
                        Instructions
                    </h3>

                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <FaCheck className="text-emerald-500 mt-1 shrink-0" size={12} />
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Speak one product at a time</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <FaCheck className="text-emerald-500 mt-1 shrink-0" size={12} />
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Say brand clearly if applicable</p>
                                <p className="text-xs text-slate-400 mt-0.5">Tata Salt, Aashirvaad Atta</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <FaCheck className="text-emerald-500 mt-1 shrink-0" size={12} />
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Use generic names if unbranded</p>
                                <p className="text-xs text-slate-400 mt-0.5">Namak, Rice, Mirch</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <FaCheck className="text-emerald-500 mt-1 shrink-0" size={12} />
                            <div>
                                <p className="font-bold text-slate-700 text-sm">Review products before saving</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* RIGHT: Action Area */}
                <div className="bg-slate-50 p-8 md:p-12 flex flex-col items-center justify-center text-center border-l border-slate-100">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-6">
                        <FaMicrophone size={32} />
                    </div>

                    <h3 className="text-xl font-black text-slate-800 mb-2">Ready to Listen?</h3>
                    <p className="text-sm text-slate-500 mb-8 max-w-[200px]">
                        Microphone will activate on the next screen.
                    </p>

                    <button
                        onClick={onStart}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center gap-2 group"
                    >
                        Start Voice Listing
                        <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-bold">
                        English & Hindi Supported
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

// --- HELPER FUNCTIONS ---
function capitalize(word) {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function capitalizeWords(str) {
    return str
        .split(" ")
        .map(w => capitalize(w))
        .join(" ");
}

// --- NORMALIZATION CONSTANTS ---
// --- STEP 4: STATIC SYNONYM DICTIONARY (LOCKED) ---
// Maps many variations to ONE canonical internal key
const SYNONYM_DICTIONARY = {
    "rice": "rice", "chawal": "rice", "basmati": "rice", "chaawal": "rice",
    "atta": "atta", "aata": "atta", "wheat flour": "atta", "gehun": "atta",
    "namak": "salt", "salt": "salt",
    "sugar": "sugar", "cheeni": "sugar", "shakkar": "sugar",
    "oil": "oil", "cooking oil": "oil", "tel": "oil",
    "milk": "milk", "doodh": "milk",
    "curd": "curd", "dahi": "curd",
    "paneer": "paneer", "butter": "butter",
    "potato": "potato", "aloo": "potato", "onion": "onion", "pyaaz": "onion",
    "tomato": "tomato", "tamatar": "tomato",
    "soap": "soap", "sabun": "soap", "detergent": "soap",
    "dal": "lentils", "pulses": "lentils", "toor dal": "lentils", "moong dal": "lentils",
    "bread": "bread", "pav": "bread"
};

const CANONICAL_NAMES = {
    "rice": "Rice", "atta": "Atta", "salt": "Salt", "sugar": "Sugar",
    "oil": "Cooking Oil", "milk": "Milk",
    "curd": "Curd", "paneer": "Paneer", "butter": "Butter", "potato": "Potato",
    "onion": "Onion", "tomato": "Tomato", "apple": "Apple", "banana": "Banana",
    "soap": "Soap", "shampoo": "Shampoo", "bread": "Bread"
};

const NON_PRODUCT_WORDS = [
    "haan", "haan to", "achha", "accha", "theek", "ok", "okay",
    "haan ji", "bolo", "sunao", "haan to sab", "hello", "hi",
    "सुनो", "नमस्ते", "ठीक", "अच्छा", "हाँ"
];

const BRANDS = [
    "tata",
    "aashirvaad",
    "fortune",
    "amul",
    "patanjali"
];

function isValidProduct(text) {
    const t = text.toLowerCase().trim();
    if (!t || t.length < 2) return false;
    return !NON_PRODUCT_WORDS.some(w => t.includes(w));
}

// --- NORMALIZATION CORE LOGIC ---
function normalizeSpokenProduct(spokenText) {
    const text = spokenText.toLowerCase().trim();

    let brand = null;
    let variant = null;
    let baseText = text;

    // 1. Detect brand
    for (const b of BRANDS) {
        if (text.startsWith(b + " ")) {
            brand = capitalize(b);
            baseText = text.replace(b, "").trim();
            break;
        }
    }

    // 2. Resolve via Static Synonym Dictionary (Step 4)
    const canonicalKey = SYNONYM_DICTIONARY[baseText];
    let normalizedName = canonicalKey ? CANONICAL_NAMES[canonicalKey] : capitalizeWords(baseText);

    // High confidence for dictionary matches
    const recognitionConfidence = canonicalKey ? 0.95 : 0.5;

    // 3. Variant detection
    if (baseText.includes("lite") || baseText.includes("light")) {
        variant = "Lite";
        if (!canonicalKey) {
            normalizedName = normalizedName.replace(/Lite|Light/i, "").trim();
        }
    }

    // 4. Decide if this is unclear (Step 11: Safe Failure / Scope Control)
    // If we recognize it's a "Pen" or "Pipe" but it's not in our grocery scope, the AI gate (Step 6) will handle it.
    // Here we just flag potential ambiguity.
    const needsCategoryReview = !canonicalKey && baseText.split(" ").length > 3;

    return {
        rawText: spokenText,
        normalizedName,
        canonicalKey,
        brand,
        variant,
        isGeneric: !brand,
        recognitionConfidence,
        needsCategoryReview,
        suggestedCategory: needsCategoryReview ? "OTHERS" : null,
    };
}

// --- STEP 5: EXCEL REFERENCE (SIMULATED FOR TRAINING) ---
// Extracted from subcategory-specific sheets
const EXCEL_REFERENCE = {
    // "General Provision" Sheet
    "detergent": "General Provision / Kirana",
    "surf excel": "General Provision / Kirana",
    "tide": "General Provision / Kirana",
    "toothpaste": "General Provision / Kirana",
    "colgate": "General Provision / Kirana",
    "pepsodent": "General Provision / Kirana",
    "dishwash": "General Provision / Kirana",
    "vim": "General Provision / Kirana",

    // "Fruits & Vegetables" Sheet
    "broccoli": "Fruits & Vegetables",
    "capsicum": "Fruits & Vegetables",
    "shimla mirch": "Fruits & Vegetables",
    "strawberry": "Fruits & Vegetables",
    "kiwi": "Fruits & Vegetables",

    // "Dairy & Ice Cream" Sheet
    "yogurt": "Dairy & Ice Cream",
    "magnum": "Dairy & Ice Cream",
    "cornetto": "Dairy & Ice Cream",
    "yakult": "Dairy & Ice Cream",

    // "Dry Fruits" Sheet
    "pistachio": "Dry Fruits & Spices",
    "pista": "Dry Fruits & Spices",
    "walnut": "Dry Fruits & Spices",
    "akhrot": "Dry Fruits & Spices",
    "cardamom": "Dry Fruits & Spices",
    "elaichi": "Dry Fruits & Spices"
};

// --- CATEGORY ASSIGNMENT CONSTANTS ---
const CATEGORY_KEYWORDS = {
    "General Provision / Kirana": ["salt", "sugar", "atta", "flour", "rice", "chawal", "oil", "biscuits", "dal", "lentils", "soap", "toothpaste", "shampoo"],
    "Fruits & Vegetables": ["apple", "banana", "potato", "onion", "tomato", "vegetable", "fruit", "mango", "ginger", "garlic", "lemon"],
    "Dairy & Ice Cream": ["milk", "curd", "paneer", "butter", "cheese", "ice cream", "yogurt", "cream", "milkshake"],
    "Bakery & Cake Shop": ["bread", "cake", "pastry", "cookie", "muffin", "bun", "pav", "toast"],
    "Sweet Shop (Mithai & Farsan)": ["ladoo", "mithai", "samosa", "kachori", "jalebi", "namkeen", "chips"],
    "Dry Fruits & Spices": ["almond", "cashew", "kaju", "badam", "spice", "masala", "mirch", "turmeric", "clove", "cardamom"],
    "Wholesale / Grain Mart": ["sack", "bulk", "grain", "wheat", "gehun", "bajra", "jowar"],
    "Organic / Gourmet": ["organic", "honey", "avocado", "olive oil", "quinoa"],
    "Other": []
};


// --- CATEGORY ASSIGNMENT LOGIC ---
function ruleBasedCategory(normalizedName, allowedCategories) {
    const name = normalizedName.toLowerCase();

    for (const category of allowedCategories) {
        const keywords = CATEGORY_KEYWORDS[category];
        if (!keywords) continue;

        for (const key of keywords) {
            if (name.includes(key)) {
                return { category, confidence: 0.9 };
            }
        }
    }
    return null;
}

// --- STEP 6: SIMULATED CATEGORY AI (GATED) ---
// This simulates a restricted LLM/Classifier context
function simulatedAICategory(product, allowedCategories) {
    const name = product.normalizedName.toLowerCase();
    const OTHERS_LABEL = allowedCategories.find(c => c.toLowerCase() === 'other') || "Other";

    // AI Logic for Broad Grocery associations
    if (name.includes("cleaning") || name.includes("wash") || name.includes("shampoo") || name.includes("detergent")) {
        return { category: "General Provision / Kirana", confidence: 0.72 }; // SUGGESTED -> Needs Review
    }

    if (name.includes("vegetable") || name.includes("fruit") || name.includes("leaf") || name.includes("berry") || name.includes("gourd")) {
        return { category: "Fruits & Vegetables", confidence: 0.68 }; // SUGGESTED -> Needs Review
    }

    if (name.includes("frozen") || name.includes("cold") || name.includes("kulfi")) {
        return { category: "Dairy & Ice Cream", confidence: 0.75 }; // SUGGESTED -> Needs Review
    }

    // Non-Grocery Detected (AI knows it's a 'Pen' but shop type is 'Grocery')
    const nonGroceryItems = ["pen", "pencil", "charger", "mobile", "wire", "pipe", "cement"];
    if (nonGroceryItems.some(item => name.includes(item))) {
        return { category: OTHERS_LABEL, confidence: 0.99 }; // AI strongly agrees it doesn't fit Grocery
    }

    return { category: OTHERS_LABEL, confidence: 0.40 }; // Fallback to unsure
}

// --- STEP 8: CORRECTION MEMORY (SESSION-BASED) ---
// Temporary store for overrides to improve same-session suggestions
let sessionCorrectionMemory = {};

function assignCategory(product, shopType, allowedSubCategories) {
    const pName = product.normalizedName.toLowerCase();

    // 0. Manual Correction Memory (Step 8 Logic)
    if (sessionCorrectionMemory[pName]) {
        return {
            ...product,
            category: sessionCorrectionMemory[pName].category,
            categoryConfidence: 0.85, // Boosted but below rule level
            categorySource: "MEMORY",
            reasoning: "Suggested based on your previous correction for this item."
        };
    }

    // 1. Static Dictionary (Step 4) - RULE (Confidence 0.95)
    const ruleMatch = ruleBasedCategory(
        product.normalizedName,
        allowedSubCategories
    );

    if (ruleMatch) {
        return {
            ...product,
            category: ruleMatch.category,
            categoryConfidence: 0.95,
            categorySource: "RULE",
            reasoning: "Matched using known grocery synonym list."
        };
    }

    // 2. Excel Reference Match (Step 5) - EXCEL (Confidence 0.80)
    const excelMatch = EXCEL_REFERENCE[pName] ||
        (product.canonicalKey && EXCEL_REFERENCE[product.canonicalKey]);

    if (excelMatch && allowedSubCategories.includes(excelMatch)) {
        return {
            ...product,
            category: excelMatch,
            categoryConfidence: 0.8,
            categorySource: "EXCEL",
            reasoning: "Identified using standardized grocery product data."
        };
    }

    // 3. Category AI (Step 6) - GATED
    const aiMatch = simulatedAICategory(product, allowedSubCategories);

    // GATE 1: High Confidence Match (>= 0.80)
    if (aiMatch.confidence >= 0.80) {
        return {
            ...product,
            category: aiMatch.category,
            categoryConfidence: aiMatch.confidence,
            categorySource: "AI",
            reasoning: "AI analysis confirms high-probability grocery match."
        };
    }

    // GATE 2: Marginal/Suggested Match (0.60 - 0.79)
    if (aiMatch.confidence >= 0.60) {
        return {
            ...product,
            category: aiMatch.category,
            categoryConfidence: aiMatch.confidence,
            categorySource: "AI_SUGGESTED",
            reasoning: "Probable grocery match. Please verify."
        };
    }

    // GATE 3: Safety Valve (Fallback to Other)
    const OTHERS_LABEL = allowedSubCategories.find(c => c.toLowerCase() === 'other') || "Other";
    return {
        ...product,
        category: OTHERS_LABEL,
        categoryConfidence: 0.3,
        categorySource: "FALLBACK",
        reasoning: "Unclear or ambiguous product. Routed to safety bucket."
    };
}

// --- UNIT MAPPING ---
const SHOP_UNITS = {
    "GROCERY_KIRANA": ["kg", "g", "litre", "ml", "piece", "packet", "dozen"],
    "ELECTRICAL_HARDWARE_AUTO": ["piece", "set", "meter", "box", "packet"],
    "TECH_ACCESSORIES": ["piece", "set", "unit"],
    "STUDENT_OFFICE": ["piece", "packet", "set", "dozen", "box"],
    "HOME_LIFESTYLE": ["piece", "set", "meter", "pair"],
    "PHARMACY": ["strip", "bottle", "piece", "box", "ml"],
    "HOME_BUSINESS": ["piece", "kg", "plate", "set"],
    "SEASONAL_STORE": ["piece", "packet", "set"]
};

// --- PRODUCT DETAIL ROW ---
function ProductDetailRow({ product, allowedSubCategories, units, onChange }) {
    // Local state for immediate UI feedback
    const [category, setCategory] = useState(product.category || "");
    const [unit, setUnit] = useState(product.unit || "");
    const [quantity, setQuantity] = useState(product.quantity || 0);
    const [price, setPrice] = useState(product.pricePerUnit || 0);
    const [imagePreview, setImagePreview] = useState(product.imagePreview || null);

    // Hierarchical fallback: User Upload -> Specific Product Icon -> Category Icon -> Default "Other"
    const productKey = product.normalizedName?.toLowerCase() || "";
    const displayImage =
        imagePreview ||
        PRODUCT_IMAGE_MAP[productKey] ||
        CATEGORY_IMAGE_MAP[category] ||
        CATEGORY_IMAGE_MAP["Other"];

    // 1. Sync FROM props (only when props change specifically)
    useEffect(() => {
        if (product.category !== undefined) setCategory(product.category);
        if (product.unit !== undefined) setUnit(product.unit);
        if (product.quantity !== undefined) setQuantity(product.quantity);
        if (product.pricePerUnit !== undefined) setPrice(product.pricePerUnit);
        if (product.imagePreview !== undefined) setImagePreview(product.imagePreview);
    }, [product.category, product.unit, product.quantity, product.pricePerUnit, product.imagePreview]);

    // 2. Sync TO parent (via manual event handlers ONLY to prevent loops)
    const updateParent = (updates) => {
        onChange({
            ...product,
            ...updates
        });
    };

    const handleCategoryChange = (val) => {
        setCategory(val);
        // Record override in session memory (Step 8)
        if (val !== product.category && val !== "") {
            sessionCorrectionMemory[product.normalizedName.toLowerCase()] = {
                category: val,
                updatedAt: new Date()
            };
        }
        updateParent({ category: val });
    };

    const handleUnitChange = (val) => {
        setUnit(val);
        updateParent({ unit: val });
    };

    const handleQuantityChange = (val) => {
        setQuantity(val);
        updateParent({ quantity: Number(val) });
    };

    const handlePriceChange = (val) => {
        setPrice(val);
        updateParent({ pricePerUnit: Number(val) });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
            updateParent({ imageFile: file, imagePreview: url });
        }
    };

    return (
        <div className="details-grid-row">
            {/* 1. Image & Name */}
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <img
                        src={displayImage}
                        alt={category}
                        className="product-thumb"
                        onError={(e) => e.target.src = "https://placehold.co/48x48?text=Img"}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                        <label className="p-1 text-white cursor-pointer" title="Change Photo">
                            <FaCamera size={10} />
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{product.normalizedName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        {product.brand && <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">{product.brand}</span>}
                        <span className="text-[10px] text-slate-300">Raw: "{product.rawText}"</span>
                    </div>
                </div>
            </div>

            {/* 2. Category */}
            <div>
                <select
                    value={category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className={`compact-input ${!category ? 'input-error' : ''}`}
                >
                    <option value="">Select Category</option>
                    {allowedSubCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
            </div>

            {/* 3. Qty & Unit */}
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={quantity || ""}
                    onChange={e => handleQuantityChange(e.target.value)}
                    className={`compact-input !w-16 ${quantity <= 0 ? 'input-error' : ''}`}
                />
                <select
                    value={unit}
                    onChange={e => handleUnitChange(e.target.value)}
                    className={`compact-input min-w-[90px] ${!unit ? 'input-error' : ''}`}
                >
                    <option value="">Unit</option>
                    {units.map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
            </div>

            {/* 4. Price */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                <input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={price || ""}
                    onChange={e => handlePriceChange(e.target.value)}
                    className={`compact-input pl-6 !w-24 ${price <= 0 ? 'input-error' : ''}`}
                />
            </div>

            {/* 5. Total */}
            <div className="font-bold text-slate-900 text-sm">
                ₹{(Number(quantity) * Number(price)).toLocaleString()}
            </div>

            {/* 6. Action */}
            <div className="flex justify-center">
                <button
                    onClick={() => onChange({ ...product, _delete: true })}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                    title="Remove item"
                >
                    <FaTrash size={14} />
                </button>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function VoiceProductAdd() {
    const navigate = useNavigate();
    const recognitionRef = useRef(null);
    const [step, setStep] = useState(1); // 1: Instructions, 2: Listing, 3: Details
    const [listening, setListening] = useState(false);
    const [products, setProducts] = useState([]); // Stores draft objects
    const [detailedProducts, setDetailedProducts] = useState([]); // Stores finalized objects
    const [subCategories, setSubCategories] = useState([]); // Shop's subcategories
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    // Assuming useAuth is defined elsewhere and provides user and token
    const { user, token } = useAuth();

    const shopTypeKey = user?.shopDetails?.shopType || 'GROCERY_KIRANA';
    const availableUnits = SHOP_UNITS[shopTypeKey] || SHOP_UNITS["GROCERY_KIRANA"];

    // Use a ref to keep subCategories fresh for the speech callback without causing loops
    const subCategoriesRef = useRef([]);

    useEffect(() => {
        subCategoriesRef.current = subCategories;
    }, [subCategories]);

    const fetchSubCategories = async () => {
        const cats = getCategoriesForShop(shopTypeKey);
        setSubCategories(cats);
        return;

        try {
            // Fallback to fetch if needed, but master CATEGORIES is usually enough
            const cats = getCategoriesForShop(shopTypeKey);
            setSubCategories(cats);
        } catch (error) {
            console.error("Failed to set subcategories", error);
            setError("Failed to load categories.");
        }
    };

    useEffect(() => {
        fetchSubCategories();

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN"; // Latin script for Hindi words fixes mapping
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const lastResult =
                event.results[event.results.length - 1][0].transcript;

            const cleanedTranscript = lastResult.trim();
            if (!cleanedTranscript || !isValidProduct(cleanedTranscript)) return;

            const normalized = normalizeSpokenProduct(cleanedTranscript);
            // Use ref for subcategories to avoid re-running effect when they change
            const categorized = assignCategory(normalized, shopTypeKey, subCategoriesRef.current.map(c => c.label));

            setProducts((prev) => {
                // Relaxed de-duplication: Allow same name so user can add different sizes/variants.
                // The backend will handle the final identity-based merge.
                return [...prev, categorized];
            });
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error", event.error);
            setListening(false);
            if (event.error === 'not-allowed') {
                setError("Microphone access denied. Please allow microphone permissions.");
            } else if (event.error === 'network') {
                setError("Network error occurred with speech recognition.");
            }
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognitionRef.current = recognition;
    }, [shopTypeKey, token]); // Removed subCategories dependency to break the loop

    const startListening = () => {
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.start();
            setListening(true);
        } catch (e) {
            console.error("Recognition already started", e);
        }
    };

    const stopListening = () => {
        if (!recognitionRef.current) return;
        recognitionRef.current.stop();
        setListening(false);
    };

    const bulkApplyCategory = (cat) => {
        setDetailedProducts(prev => prev.map(p => ({ ...p, category: cat })));
    };

    const bulkApplyUnit = (unit) => {
        setDetailedProducts(prev => prev.map(p => ({ ...p, unit })));
    };

    const handleProductChange = (index, updatedProduct) => {
        if (updatedProduct._delete) {
            setDetailedProducts(prev => prev.filter((_, i) => i !== index));
            return;
        }
        setDetailedProducts(prev => {
            const next = [...prev];
            next[index] = updatedProduct;
            return next;
        });
    };

    const finishListing = () => {
        stopListening();
        // Initialize detailed products with draft data
        setDetailedProducts(products.map(p => ({
            ...p,
            unit: "",
            quantity: 0,
            pricePerUnit: 0
        })));
        setStep(3);
    };

    // --- STEP 10: INVENTORY FLOW LOCK (SINGLE SOURCE OF TRUTH) ---
    const saveAllProducts = async () => {
        // Final Validation (Guardrails)
        const invalidProducts = detailedProducts.filter(p => !p.unit || !availableUnits.includes(p.unit) || p.quantity <= 0 || p.pricePerUnit <= 0 || !p.category);

        if (invalidProducts.length > 0) {
            alert(`Cannot save! ${invalidProducts.length} products have missing or invalid details (Unit/Price/Qty).`);
            return;
        }

        setIsSaving(true);
        try {
            const payload = detailedProducts.map(p => {
                const catInfo = CATEGORIES.find(c => c.id === p.category || c.label === p.category);
                return {
                    name: p.normalizedName,
                    brand: p.brand || null,
                    shopType: shopTypeKey,
                    category: catInfo?.label || 'General',
                    categorySlug: catInfo?.id || 'general-provision',
                    subCategory: catInfo?.group || 'General',
                    unit: p.unit, // Confirmed Unit
                    quantity: p.quantity,
                    pricePerUnit: p.pricePerUnit
                };
            });

            // Step 10: Commit to Inventory
            const res = await fetch(`/api/seller/products/bulk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ products: payload })
            });

            const data = await res.json();

            if (res.ok) {
                // Auto-navigate without alert for smoother experience, using replace to refresh SellerInventory
                navigate("/seller/inventory", { replace: true });
            } else {
                alert(data.message || "Failed to commit to inventory.");
                setIsSaving(false);
            }
        } catch (error) {
            console.error("Save Error:", error);
            alert("Network error while saving. Please try again.");
            setIsSaving(false);
        }
    };

    // Global validation for Save button (Step 9: Unit Guardrails)
    const isSaveDisabled = detailedProducts.length === 0 || detailedProducts.some(p =>
        !p.unit || !availableUnits.includes(p.unit) || p.quantity <= 0 || p.pricePerUnit <= 0 || !p.category
    );

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-[2rem] border border-red-100">
                <p className="text-red-500 font-bold">{error}</p>
                <Link to="/seller/products" className="mt-4 inline-block text-indigo-600 font-bold">Back to Hub</Link>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Unified Header Bar */}
            <header className="mx-auto max-w-5xl mb-8 flex items-center gap-4">
                <button
                    onClick={() => {
                        if (step > 1) {
                            setStep(step - 1);
                        } else {
                            navigate("/seller/inventory", { replace: true });
                        }
                    }}
                    className="p-3 rounded-full bg-white shadow-md hover:shadow-lg border border-slate-100 text-slate-500 hover:text-slate-800 transition-all group"
                    title="Go back"
                >
                    <FaArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[#433422]">
                        {step === 3 ? "Product Details" : "Voice Listing"}
                    </h1>
                    <p className="text-[#92817A] text-sm font-medium">
                        {step === 3 ? "Review information before saving." : "Add products hands-free to your inventory"}
                    </p>
                </div>
                {step === 3 && (
                    <div className="quick-apply-group">
                        <span className="text-[10px] font-black text-slate-400 self-center px-2 uppercase tracking-wide">Quick Apply:</span>
                        <select
                            value=""
                            onChange={e => {
                                bulkApplyCategory(e.target.value);
                                e.target.value = ""; // Reset
                            }}
                            className="compact-input !w-auto !bg-white !py-1"
                        >
                            <option value="">Apply Category</option>
                            {subCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                        <select
                            value=""
                            onChange={e => {
                                bulkApplyUnit(e.target.value);
                                e.target.value = ""; // Reset
                            }}
                            className="compact-input !w-auto !bg-white !py-1"
                        >
                            <option value="">Apply Unit</option>
                            {availableUnits.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>
                )}
                {step !== 3 && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border border-blue-100">
                        <span>💡</span>
                        <span>You can edit details before saving</span>
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <VoiceInstructions key="instructions" onStart={() => setStep(2)} />
                ) : step === 2 ? (
                    <main className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT: Microphone Card */}
                        <motion.div
                            key="mic-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col justify-between min-h-[450px]"
                        >
                            {/* Mic Button Area */}
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <button
                                    className={`relative group flex items-center justify-center w-32 h-32 rounded-full transition-all cursor-pointer ${listening
                                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                        : 'bg-indigo-50 hover:bg-indigo-100 shadow-md'
                                        }`}
                                    onClick={listening ? stopListening : startListening}
                                >
                                    <FaMicrophone
                                        className={`text-4xl transition-colors ${listening ? 'text-white' : 'text-indigo-600'}`}
                                    />
                                    {listening && (
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-30 animate-ping"></span>
                                    )}
                                </button>
                                <p className="mt-6 text-lg font-semibold text-slate-700">
                                    {listening ? "Listening... Speak product names" : "Tap to Speak"}
                                </p>
                            </div>

                            {/* Next Button */}
                            <button
                                disabled={products.length === 0}
                                onClick={finishListing}
                                className={`w-full py-4 rounded-xl font-semibold text-sm transition-all ${products.length > 0
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <FaCheck size={14} />
                                    Next: Details
                                </span>
                            </button>
                        </motion.div>

                        {/* RIGHT: Detected Items Card */}
                        <motion.div
                            key="items-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col min-h-[450px]"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800">Detected Items</h2>
                                <div className="flex items-center gap-2">
                                    {listening && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>}
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                                        {products.length}
                                    </span>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto">
                                {products.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-8">
                                        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                        </svg>
                                        <p className="text-slate-400 text-sm font-medium">
                                            No items detected yet.<br />
                                            Start speaking to list products.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {products.map((p, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ x: 20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <span className="font-bold text-slate-800 text-base">
                                                            {p.brand && <span className="text-indigo-600 mr-2">{p.brand}</span>}
                                                            {p.normalizedName}
                                                            {p.variant && <span className="ml-2 text-slate-400 text-sm">({p.variant})</span>}
                                                        </span>
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1 flex items-center gap-2">
                                                            <span>Raw: "{p.rawText}"</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span className="text-indigo-500">{p.assignedCategory}</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {(p.categorySource === 'REVIEW' || p.categorySource === 'FALLBACK') ? (
                                                            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold rounded uppercase border border-amber-200 flex items-center gap-1">
                                                                <FaExclamationTriangle size={8} /> Review
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase border border-emerald-200">
                                                                ✓ Match
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => setProducts(products.filter((_, idx) => idx !== i))}
                                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </main>
                ) : (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-5xl mx-auto details-stage-container"
                    >
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            {/* NEW GRID HEADER */}
                            <div className="details-grid-header">
                                <div className="">Product</div>
                                <div className="">Category</div>
                                <div className="">Qty / Unit</div>
                                <div className="">Price</div>
                                <div className="">Total</div>
                                <div className="text-center">Action</div>
                            </div>

                            <div className="flex flex-col">
                                {detailedProducts.map((product, index) => (
                                    <ProductDetailRow
                                        key={index}
                                        product={product}
                                        allowedSubCategories={subCategories}
                                        units={availableUnits}
                                        onChange={(updated) => handleProductChange(index, updated)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* STICKY FOOTER */}
                        <div className="sticky-footer-bar">
                            <div className="text-sm text-slate-500 font-medium">
                                <span className="font-bold text-indigo-600">{detailedProducts.filter(p => p.unit && p.quantity > 0 && p.pricePerUnit > 0).length}</span> items ready to save.
                            </div>
                            <button
                                disabled={isSaveDisabled || isSaving}
                                onClick={saveAllProducts}
                                className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-sm transition-all ${isSaveDisabled || isSaving
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 active:scale-95'
                                    }`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck /> Save {detailedProducts.length} Products
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
