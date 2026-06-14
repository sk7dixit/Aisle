const SearchAnalytics = require("../models/SearchAnalytics");

async function trackSearch(data) {
    try {
        const keywordTrimmed = data.keyword ? data.keyword.trim() : "";
        if (!keywordTrimmed) return null;

        const doc = await SearchAnalytics.create({
            userId: data.userId || null,
            keyword: keywordTrimmed,
            normalizedKeyword: keywordTrimmed.toLowerCase(),
            city: data.city || "Unknown",
            state: data.state || "Unknown",
            latitude: data.latitude,
            longitude: data.longitude,
            category: data.category || null,
            resultsCount: data.resultsCount || 0,
            source: data.source || "search_bar"
        });
        return doc;
    } catch (err) {
        console.error("Search Analytics Error:", err.message);
        return null;
    }
}

module.exports = {
    trackSearch
};
