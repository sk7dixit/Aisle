const languageDictionary = require('./languageDictionary');
const calculateConfidence = require('./calculateConfidence');

const intentCategories = {
    PRODUCT_VISIBILITY: 'PRODUCT',
    PRODUCT_ADDITION: 'PRODUCT',
    IMAGE_UPLOAD: 'IMAGE',
    IMAGE_QUALITY: 'IMAGE',
    SALES_TRACKING: 'ORDERS',
    OFFER_VISIBILITY: 'OFFERS',
    SHOP_STATUS: 'SETTINGS',
    LOGIN_ISSUES: 'LOGIN',
    PAYMENT_PENDING: 'PAYMENTS',
    PAYOUT_ISSUE: 'PAYMENTS',
    FRAUD_PAYMENT: 'SECURITY',
    SECURITY_ISSUE: 'SECURITY'
};

/**
 * Parses user input text (English, Hindi, Hinglish) and maps it to a standard intent
 * with a category classification and confidence rating (0-100).
 */
const detectIntent = (text) => {
    if (!text || typeof text !== 'string') {
        return { intent: 'UNKNOWN', category: 'GENERAL', confidence: 0 };
    }

    const cleanText = text.toLowerCase().trim();
    let bestIntent = 'UNKNOWN';
    let bestConfidence = 0;

    // Iterate through all intents in the dictionary
    for (const [intent, phrases] of Object.entries(languageDictionary)) {
        for (const phrase of phrases) {
            const phraseTokens = phrase.split(/\s+/).filter(w => w.length > 1);
            
            // Calculate base confidence
            let confidence = calculateConfidence(cleanText, phraseTokens);

            // Substring check (e.g. "my product not visible" contains "product not visible")
            if (cleanText.includes(phrase)) {
                confidence = Math.max(confidence, 90);
            }

            // Word-by-word token overlap check (Hindi/Hinglish exact triggers)
            if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestIntent = intent;
            }
        }
    }

    // Default to UNKNOWN if confidence is extremely low
    if (bestConfidence < 20) {
        bestIntent = 'UNKNOWN';
        bestConfidence = 0;
    }

    return {
        intent: bestIntent,
        category: intentCategories[bestIntent] || 'GENERAL',
        confidence: bestConfidence
    };
};

module.exports = detectIntent;
