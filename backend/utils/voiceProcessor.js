/**
 * voiceProcessor.js
 * Handles normalization and entity extraction for Indian voice input
 */

// 1. Dictionaries
const FILLERS = ['bhai', 'bhaiya', 'thoda', 'chahiye', 'ka', 'ki', 'ko', 'please', 'ek', 'do', 'aur', 'and', 'with', 'wala', 'dena', 'dikhana'];

const NUMBER_MAP = {
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'che': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'aadha': 0.5, 'dedh': 1.5, 'adhai': 2.5,
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'half': 0.5
};

const BASES = {
    'milk': 'Milk', 'doodh': 'Milk',
    'curd': 'Curd', 'dahi': 'Curd', 'yoghurt': 'Curd',
    'bread': 'Bread', 'pav': 'Bread',
    'butter': 'Butter', 'makkhan': 'Butter',
    'rice': 'Rice', 'chawal': 'Rice',
    'atta': 'Atta', 'flour': 'Atta', 'aata': 'Atta',
    'oil': 'Oil', 'tel': 'Oil',
    'salt': 'Salt', 'namak': 'Salt',
    'sugar': 'Sugar', 'shakkar': 'Sugar', 'chini': 'Sugar',
    'paracetamol': 'Paracetamol', 'bukhar': 'Paracetamol', 'medicine': 'Paracetamol'
};

const BRANDS = [
    'Amul', 'Mother Dairy', 'Gowardhan', 'Nestle', 'Britannia', 'Wibs',
    'Aashirvaad', 'India Gate', 'Daawat', 'Fortune', 'Tata', 'Saffola',
    'Dolo', 'Crocin', 'Metacin'
];

const ATTRIBUTES = ['toned', 'full cream', 'cow', 'buffalo', 'slim', 'skim', 'white', 'brown', 'whole wheat', 'multigrain'];

// 2. Normalizer
const normalizeText = (text) => {
    if (!text) return '';
    let normalized = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");

    // Replace numbers
    Object.keys(NUMBER_MAP).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        normalized = normalized.replace(regex, NUMBER_MAP[key]);
    });

    // Remove fillers (be careful not to remove product names if they overlap, but fillers are usually distinct)
    // We'll remove them only if they correspond exactly to filler words
    // Actually, simple removal is safer for search
    // FILLERS.forEach(filler => {
    //     const regex = new RegExp(`\\b${filler}\\b`, 'g');
    //     normalized = normalized.replace(regex, '');
    // });

    return normalized.replace(/\s+/g, ' ').trim();
};

const INTENTS = {
    'khatam': 'OUT_OF_STOCK',
    'nahi': 'OUT_OF_STOCK',
    'out': 'OUT_OF_STOCK',
    'stock': 'UPDATE_STOCK', // ambiguous, usually "out of stock"
    'available': 'AVAILABLE',
    'hai': 'AVAILABLE',
    'aaya': 'AVAILABLE'
};

// 3. Extractor
const extractEntities = (normalizedText) => {
    const tokens = normalizedText.split(' ');

    let base = null;
    let brand = null;
    let size = null;
    let intent = 'SEARCH'; // Default
    let statusPayload = null;
    let foundAttributes = [];

    // Detect Intent
    for (const [key, val] of Object.entries(INTENTS)) {
        if (normalizedText.includes(key)) {
            // Refine "nahi hai" vs "hai"
            if (val === 'AVAILABLE' && normalizedText.includes('nahi')) {
                intent = 'UPDATE_AVAILABILITY';
                statusPayload = 'OUT_OF_STOCK';
            } else {
                intent = 'UPDATE_AVAILABILITY';
                statusPayload = val;
            }
            break;
        }
    }

    // Detect Base
    for (const [key, val] of Object.entries(BASES)) {
        if (normalizedText.includes(key)) {
            base = val;
            break; // Priority to first match? Or longest?
        }
    }

    // Detect Brand
    for (const b of BRANDS) {
        if (normalizedText.includes(b.toLowerCase())) {
            brand = b;
            break;
        }
    }

    // Detect Size (Regex)
    // 500ml, 1L, 1kg, 1.5L
    const sizeMatch = normalizedText.match(/(\d+(\.\d+)?)\s*(ml|l|liter|lit|kg|g|gm|gram|pcs|pc)/);
    if (sizeMatch) {
        size = sizeMatch[0].replace(/\s+/, ''); // Remove space 1 kg -> 1kg
    }

    // Detect Attributes
    ATTRIBUTES.forEach(attr => {
        if (normalizedText.includes(attr)) {
            foundAttributes.push(attr);
        }
    });

    return {
        original: normalizedText,
        intent,
        statusPayload,
        base,
        brand,
        size,
        attributes: foundAttributes
    };
};

const processVoiceInput = (text) => {
    const normalized = normalizeText(text);
    return extractEntities(normalized);
};

module.exports = { processVoiceInput };
