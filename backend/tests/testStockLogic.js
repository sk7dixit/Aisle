const { calculateStockStatus } = require('../utils/stockUtils');

console.log("=== WRITING TEST CASES FOR STOCK LOGIC ===");

const testCases = [
    {
        name: "Standard In Stock",
        input: { countInStock: 100, baselineStock: 100, lowStockThreshold: 30, productType: 'STANDARD' },
        expected: 'IN_STOCK'
    },
    {
        name: "Standard Limited",
        input: { countInStock: 20, baselineStock: 100, lowStockThreshold: 30, productType: 'STANDARD' },
        expected: 'LIMITED'
    },
    {
        name: "Standard Out",
        input: { countInStock: 0, baselineStock: 100, lowStockThreshold: 10, productType: 'STANDARD' },
        expected: 'OUT_OF_STOCK'
    },
    {
        name: "Expiry Out (Expired)",
        input: {
            countInStock: 10,
            baselineStock: 20,
            lowStockThreshold: 5,
            productType: 'EXPIRY_BASED',
            expiryDate: new Date('2020-01-01') // Past
        },
        expected: 'OUT_OF_STOCK'
    },
    {
        name: "Expiry In (Valid)",
        input: {
            countInStock: 10,
            baselineStock: 10,
            lowStockThreshold: 5,
            productType: 'EXPIRY_BASED',
            expiryDate: new Date('2099-01-01') // Future
        },
        expected: 'IN_STOCK'
    },
    {
        name: "Daily Out",
        input: { countInStock: 0, baselineStock: 10, lowStockThreshold: 5, productType: 'DAILY_ESSENTIAL' },
        expected: 'OUT_OF_STOCK'
    }
];

let failed = 0;

testCases.forEach((test, index) => {
    const result = calculateStockStatus(test.input);
    if (result === test.expected) {
        console.log(`[PASS] Case ${index + 1}: ${test.name}`);
    } else {
        console.error(`[FAIL] Case ${index + 1}: ${test.name}`);
        console.error(`   Input:`, JSON.stringify(test.input));
        console.error(`   Expected: ${test.expected}, Got: ${result}`);
        failed++;
    }
});

if (failed === 0) {
    console.log("\n✅ ALL TESTS PASSED");
    process.exit(0);
} else {
    console.error(`\n❌ ${failed} TESTS FAILED`);
    process.exit(1);
}
