/**
 * Calculates a token match confidence score (0-100) between query and target keywords.
 * Uses a blend of overlap ratio and Jaccard similarity.
 */
const calculateConfidence = (query, keywords) => {
    if (!query || !keywords || keywords.length === 0) return 0;

    // Clean and tokenize query
    const queryTokens = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);

    if (queryTokens.length === 0) return 0;

    let matches = 0;
    queryTokens.forEach(token => {
        if (keywords.includes(token)) {
            matches++;
        }
    });

    if (matches === 0) return 0;

    // Calculate overlap ratio (number of matched tokens relative to query length)
    const overlapRatio = matches / queryTokens.length;

    // Jaccard similarity index: intersection / union
    const unionSize = new Set([...queryTokens, ...keywords]).size;
    const jaccard = matches / unionSize;

    // Blend: 70% overlap ratio (more weight on what user typed) + 30% Jaccard index
    const score = (overlapRatio * 0.7 + jaccard * 0.3) * 100;

    return Math.min(Math.round(score), 100);
};

module.exports = calculateConfidence;
