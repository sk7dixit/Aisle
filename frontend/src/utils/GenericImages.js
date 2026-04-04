// Generic / Placeholder images for standard categories
import groceryImg from '../assets/images/grocery_generic.png';
import electronicsImg from '../assets/images/electronics_generic.png';
import techImg from '../assets/images/tech_generic.png';
import stationeryImg from '../assets/images/stationery_generic.png';
import lifestyleImg from '../assets/images/lifestyle_generic.png';
import pharmacyImg from '../assets/images/pharmacy_generic.jpg';
import homeBusinessImg from '../assets/images/homebusiness_generic.png';
import seasonalImg from '../assets/images/seasonal_generic.jpg';

// MAP 1: Stable Category IDs (The new "Right Way")
export const CATEGORY_ID_IMAGES = {
    // --- 1. Grocery / Kirana ---
    'general-provision': groceryImg,
    'fruits-vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    'dairy-ice-cream': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80',
    'bakery-cake-shop': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
    'sweet-shop': 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=400&q=80',
    'dry-fruits-spices': 'https://images.unsplash.com/photo-1624372228384-90f3bece2e3b?auto=format&fit=crop&w=400&q=80',
    'wholesale-grain': groceryImg,
    'organic-gourmet': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',

    // --- 2. Electrical, Hardware & Auto ---
    'electrical-lighting': electronicsImg,
    'hardware-fittings': electronicsImg,
    'plumbing-sanitary': electronicsImg,
    'paints-waterproofing': electronicsImg,
    'automobile-spares': electronicsImg,
    'tools-industrial': electronicsImg,

    // --- 3. Tech & Accessories ---
    'mobiles-wearables': techImg,
    'computers-gaming': techImg,
    'tv-appliances': techImg,
    'spares-components': techImg,

    // --- 4. Student & Office ---
    'school-writing': stationeryImg,
    'office-desk': stationeryImg,
    'art-craft': stationeryImg,
    'books-paper': stationeryImg,

    // --- 5. Home & Lifestyle ---
    'kitchenware-cookware': lifestyleImg,
    'plastics-cleaning': lifestyleImg,
    'beauty-personal': 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&w=400&q=80',
    'toys-sports': lifestyleImg,
    'furnishing-decor': lifestyleImg,
    'bags-luggage': lifestyleImg,
    'footwear': lifestyleImg,
    'clothing-garments': lifestyleImg,

    // --- 6. Pharmacy ---
    'allopathic-medicines': pharmacyImg,
    'ayurvedic-wellness': 'https://images.unsplash.com/photo-1631549916768-4119b2d3f9e2?auto=format&fit=crop&w=400&q=80',
    'surgical-rehab': pharmacyImg,

    // --- 8. Home Businesses ---
    'homemade-food': homeBusinessImg,
    'handmade-crafts': homeBusinessImg,
    'tuition-coaching': homeBusinessImg,

    // --- 9. Seasonal ---
    'festival-specific': seasonalImg,
    'crackers-fireworks': seasonalImg,
    'winter-rain-gear': seasonalImg
};

// MAP 2: Legacy Display Labels (For backward compatibility)
export const GENERIC_IMAGES = {
    'General': groceryImg,
    'Groceries': groceryImg,
    'Grocery / Kirana': groceryImg,
    'Vegetables': 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=400&q=80',
    'Fruits': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    'Home & Lifestyle Goods': lifestyleImg,
    'Electronics': electronicsImg,
    'Electronics & Tools': electronicsImg,
    'Tech & Accessories': techImg,
    'Stationery': stationeryImg,
    'Student & Office Supplies': stationeryImg,
    'Hardware': electronicsImg,
    'Medical': pharmacyImg,
    'Pharmacy / Medical Store': pharmacyImg,
    'Home Businesses': homeBusinessImg,
    'Seasonal / Festive Store': seasonalImg,
    'Local Services': 'https://images.unsplash.com/photo-1581578731117-104f2a41272c?auto=format&fit=crop&w=400&q=80'
};

export const getGenericImage = (categoryInput) => {
    if (!categoryInput) return GENERIC_IMAGES['General'];

    // 1. Try EXACT Key Lookup (The "Right Way" - ID/Slug)
    if (CATEGORY_ID_IMAGES[categoryInput]) return CATEGORY_ID_IMAGES[categoryInput];

    // 2. Try Exact Label Lookup (Legacy)
    if (GENERIC_IMAGES[categoryInput]) return GENERIC_IMAGES[categoryInput];

    // 3. Normalized / Case-insensitive Key Lookup
    const lowerInput = categoryInput.toLowerCase();

    // Check IDs first
    const idKey = Object.keys(CATEGORY_ID_IMAGES).find(k => k === lowerInput);
    if (idKey) return CATEGORY_ID_IMAGES[idKey];

    // Check Labels
    const labelKey = Object.keys(GENERIC_IMAGES).find(k => k.toLowerCase() === lowerInput);
    if (labelKey) return GENERIC_IMAGES[labelKey];

    // 4. Sub-string / Keyword matching (Robust fallback for legacy strings)
    if (lowerInput.includes('grocery') || lowerInput.includes('kirana')) return GENERIC_IMAGES['Grocery / Kirana'];
    if (lowerInput.includes('tech') || lowerInput.includes('accessori') || lowerInput.includes('mobile') || lowerInput.includes('phone')) return GENERIC_IMAGES['Tech & Accessories'];
    if (lowerInput.includes('electr') || lowerInput.includes('plug') || lowerInput.includes('wire')) return GENERIC_IMAGES['Electronics'];
    if (lowerInput.includes('station') || lowerInput.includes('student') || lowerInput.includes('paper')) return GENERIC_IMAGES['Stationery'];
    if (lowerInput.includes('medic') || lowerInput.includes('pharm')) return GENERIC_IMAGES['Medical'];
    if (lowerInput.includes('home') || lowerInput.includes('life')) return GENERIC_IMAGES['Home & Lifestyle Goods'];
    if (lowerInput.includes('paint') || lowerInput.includes('hardw') || lowerInput.includes('tool') || lowerInput.includes('tap') || lowerInput.includes('pipe')) return GENERIC_IMAGES['Hardware'];
    if (lowerInput.includes('season') || lowerInput.includes('festiv') || lowerInput.includes('diya') || lowerInput.includes('deco') || lowerInput.includes('rakhi')) return GENERIC_IMAGES['Seasonal / Festive Store'];

    return GENERIC_IMAGES['General'];
};
