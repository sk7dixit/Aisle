const stationeryProducts = [
    {
        name: 'Premium Gel Pen (Pack of 5)',
        brand: 'Uniball',
        category: 'school-writing',
        imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600',
        source: 'local-stationery',
        barcode: '8901058400001',
        externalId: 'mock_stat_pen'
    },
    {
        name: 'A4 Copier Paper 75GSM 500 Sheets',
        brand: 'JK Paper',
        category: 'office-desk',
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=600',
        source: 'local-stationery',
        barcode: '8901058400002',
        externalId: 'mock_stat_paper'
    },
    {
        name: 'Spiral Bound Notebook A5',
        brand: 'Classmate',
        category: 'books-paper',
        imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600',
        source: 'local-stationery',
        barcode: '8901058400003',
        externalId: 'mock_stat_notebook'
    }
];

const searchProducts = async (query) => {
    const term = query.toLowerCase().trim();
    if (!term) return [];
    
    console.log(`[StationeryProvider] Local search matching: "${term}"`);
    if (term === 'general' || term === 'all') {
        return stationeryProducts;
    }

    const termCleaned = term.replace(/[^a-z0-9]/g, '');
    return stationeryProducts.filter(item => {
        const name = item.name.toLowerCase();
        const brand = item.brand.toLowerCase();
        const cat = item.category.toLowerCase().replace(/[^a-z0-9]/g, '');
        return name.includes(term) || brand.includes(term) || cat.includes(termCleaned) || termCleaned.includes(cat);
    });
};

module.exports = {
    searchProducts
};
