export const parseVoiceInput = (text) => {
    if (!text) return [];

    const normalizedText = text.toLowerCase()
        .replace(/ and /g, " ")
        .replace(/ aur /g, " ")
        .replace(/ tatha /g, " ")
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ") // Replace punctuation with SPACE
        .replace(/\s{2,}/g, " "); // Normalize spaces

    const items = [];
    const words = normalizedText.split(' ');

    // 1. Detect Intent (Heuristic)
    let globalIntent = 'ADD_PRODUCT'; // Default

    // RECALL Intent
    if (
        (words.includes('last') && (words.includes('item') || words.includes('dikhao'))) ||
        (words.includes('abhi') && words.includes('add')) ||
        (words.includes('recall')) ||
        (words.includes('recent')) ||
        (normalizedText.includes('recall'))
    ) {
        return [{ intent: 'RECALL' }];
    }

    if (words.some(w => ['khatam', 'out', 'stock', 'available', 'unavailable', 'nahi', 'khatm'].includes(w))) {
        globalIntent = 'UPDATE_AVAILABILITY';
    } else if (words.some(w => ['price', 'rate', 'bhav', 'mehenga', 'sasta', 'rupaye'].includes(w))) {
        globalIntent = 'UPDATE_PRICE';
    }

    // 2. Dictionary Mapping (Local -> Standard)
    // Expanded dictionary for robustness
    const dictionary = {
        // Staples
        'chawal': { name: 'Rice', category: 'Staples' },
        'chaawal': { name: 'Rice', category: 'Staples' },
        'rice': { name: 'Rice', category: 'Staples' },
        'atta': { name: 'Wheat Flour', category: 'Staples' },
        'aata': { name: 'Wheat Flour', category: 'Staples' },
        'flour': { name: 'Wheat Flour', category: 'Staples' },
        'gehu': { name: 'Wheat', category: 'Staples' },
        'dal': { name: 'Dal', category: 'Staples' },
        'daal': { name: 'Dal', category: 'Staples' },
        'lentil': { name: 'Dal', category: 'Staples' },
        'tel': { name: 'Oil', category: 'Oil' },
        'oil': { name: 'Oil', category: 'Oil' },
        'namak': { name: 'Salt', category: 'Staples' },
        'salt': { name: 'Salt', category: 'Staples' },
        'shakkar': { name: 'Sugar', category: 'Staples' },
        'chini': { name: 'Sugar', category: 'Staples' },
        'sugar': { name: 'Sugar', category: 'Staples' },
        'besan': { name: 'Gram Flour', category: 'Staples' },
        'maida': { name: 'Refined Flour', category: 'Staples' },
        'suji': { name: 'Semolina', category: 'Staples' },
        'poha': { name: 'Flattened Rice', category: 'Staples' },

        // Fresh
        'doodh': { name: 'Milk', category: 'Dairy' },
        'milk': { name: 'Milk', category: 'Dairy' },
        'dahi': { name: 'Curd', category: 'Dairy' },
        'curd': { name: 'Curd', category: 'Dairy' },
        'paneer': { name: 'Paneer', category: 'Dairy' },
        'anda': { name: 'Eggs', category: 'Dairy' },
        'egg': { name: 'Eggs', category: 'Dairy' },
        'eggs': { name: 'Eggs', category: 'Dairy' },
        'bread': { name: 'Bread', category: 'Bakery' },
        'butter': { name: 'Butter', category: 'Dairy' },
        'makkhan': { name: 'Butter', category: 'Dairy' },

        // Vegetables
        'aalu': { name: 'Potato', category: 'Vegetables' },
        'aaloo': { name: 'Potato', category: 'Vegetables' },
        'potato': { name: 'Potato', category: 'Vegetables' },
        'pyaz': { name: 'Onion', category: 'Vegetables' },
        'onion': { name: 'Onion', category: 'Vegetables' },
        'tamatar': { name: 'Tomato', category: 'Vegetables' },
        'tomato': { name: 'Tomato', category: 'Vegetables' },
    };

    // 3. Extract Products/Intents
    words.forEach((word, index) => {
        // Check if word is in dictionary
        if (dictionary[word]) {
            const product = dictionary[word];

            // Look behind for quantity (e.g., "2 kg", "do kilo", "ek")
            let quantity = 1;
            let unit = 'pc';

            const numberMap = {
                'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'panch': 5, 'che': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
                'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15, 'bis': 20, 'bees': 20,
                'pachas': 50, 'sau': 100,
                'aadha': 0.5, 'adha': 0.5, 'dedh': 1.5, 'dhai': 2.5, 'pav': 0.25, 'paav': 0.25
            };

            const prevWord = words[index - 1]; // "kg" or number
            const prevPrevWord = words[index - 2];

            if (prevWord) {
                // Case 1: "5 Chawal" -> prevWord is number
                if (!isNaN(prevWord)) quantity = parseFloat(prevWord);
                else if (numberMap[prevWord]) quantity = numberMap[prevWord];

                // Case 2: "5 kg Chawal" -> prevWord is unit, prevPrev is number
                if (['kg', 'kilo', 'l', 'liter', 'litre', 'ml', 'g', 'gram', 'gm', 'packet', 'pkt', 'box', 'piece', 'pc', 'dozen', 'darjan'].includes(prevWord)) {
                    unit = prevWord;
                    // Standardize unit names
                    if (unit === 'kilo') unit = 'kg';
                    if (unit === 'liter' || unit === 'litre') unit = 'l';
                    if (unit === 'gm') unit = 'g';
                    if (unit === 'gram') unit = 'g';
                    if (unit === 'darjan') unit = 'dozen';

                    if (prevPrevWord) {
                        if (!isNaN(prevPrevWord)) quantity = parseFloat(prevPrevWord);
                        else if (numberMap[prevPrevWord]) quantity = numberMap[prevPrevWord];
                    }
                }
            }

            items.push({
                intent: globalIntent,
                originalTerm: word,
                name: product.name,
                category: product.category,
                quantity: quantity,
                unit: unit,
                status: 'AVAILABLE',
                price: 0
            });
        }
    });

    // Fallback: If no dictionary items found, but input looks like a potential item
    if (items.length === 0 && text.trim().length > 1) {
        // Attempt to clean transcript of common filler words
        const cleanName = text
            .replace(/quantity/gi, '')
            .replace(/chahiye/gi, '')
            .replace(/add/gi, '')
            .replace(/karo/gi, '')
            .replace(/hai/gi, '')
            .trim();

        if (cleanName.length > 2) {
            items.push({
                intent: globalIntent,
                originalTerm: text,
                name: cleanName,
                category: 'General',
                quantity: 1,
                unit: 'pc',
                status: 'AVAILABLE',
                price: 0
            });
        }
    }

    return items;
};
