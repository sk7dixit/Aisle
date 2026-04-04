const loader = require('./backend/utils/catalogLoader');
const data = loader.loadExcelCatalog('PHARMACY');
console.log('--- Pharmacy Catalog Verification ---');
console.log('Total Categories:', data.length);
data.forEach(c => {
    console.log(`- ${c.categoryName} (${c.categoryId}): ${c.products.length} products`);
    if (c.products.length > 0) {
        console.log(`  Sample: ${c.products[0].baseName} - ${c.products[0].indicativePrice}`);
    }
});
