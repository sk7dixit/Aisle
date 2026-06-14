const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        console.log(`[Test API] Attempting to connect to OpenFoodFacts...`);
        const response = await axios.get(
            'https://world.openfoodfacts.org/cgi/search.pl',
            {
                params: {
                    search_terms: 'maggi',
                    search_simple: 1,
                    action: 'process',
                    json: 1,
                    page_size: 5
                },
                headers: {
                    'User-Agent': 'AisleApp/1.0 (shoplens017@gmail.com)'
                },
                timeout: 5000
            }
        );

        res.json(response.data);

    } catch (error) {
        console.warn(`[Test API] OpenFoodFacts returned error: ${error.message}. Returning robust mock data fallback.`);
        
        // Return a mock OpenFoodFacts format response when external API is down
        res.json({
            products: [
                {
                    _id: "mock_maggi_1",
                    product_name: "Maggi 2-Minute Masala Noodles",
                    brands: "Nestle",
                    categories_tags: ["en:snacks", "en:instant-foods"],
                    image_front_url: "https://images.unsplash.com/photo-1612966608967-3e2b81c6e59b?auto=format&fit=crop&q=80&w=600",
                    code: "8901058821034"
                },
                {
                    _id: "mock_maggi_2",
                    product_name: "Maggi Hot & Sweet Tomato Chili Sauce",
                    brands: "Nestle",
                    categories_tags: ["en:sauces", "en:condiments"],
                    image_front_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=600",
                    code: "8901058002315"
                }
            ],
            count: 2,
            page: 1,
            page_size: 5
        });
    }
});

module.exports = router;
