const supportKnowledgeBase = require('./supportKnowledgeBase');
const calculateConfidence = require('./calculateConfidence');

/**
 * Searches the support FAQs / knowledge base using keyword overlaps and substring matching.
 * Returns issues ranked by confidence score.
 */
const searchIssues = (query) => {
    if (!query || typeof query !== 'string') return [];

    const cleanQuery = query.toLowerCase().trim();
    const results = [];

    for (const issue of supportKnowledgeBase) {
        // Score overlap against title tokens
        const titleTokens = issue.title.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const titleConfidence = calculateConfidence(cleanQuery, titleTokens);

        // Score overlap against keyword dictionary
        const keywordConfidence = calculateConfidence(cleanQuery, issue.keywords);

        let confidence = Math.max(titleConfidence, keywordConfidence);

        // Substring boosts for quick typing matching
        if (issue.title.toLowerCase().includes(cleanQuery)) {
            confidence = Math.max(confidence, 80);
        }

        if (issue.keywords.some(kw => kw.startsWith(cleanQuery))) {
            confidence = Math.max(confidence, 50);
        }

        if (confidence > 15) {
            results.push({
                id: issue.id,
                title: issue.title,
                category: issue.category,
                solution: issue.solution,
                defaultPriority: issue.defaultPriority,
                confidence
            });
        }
    }

    // Sort by confidence score descending
    return results.sort((a, b) => b.confidence - a.confidence);
};

module.exports = searchIssues;
