async function testAddProduct() {
    try {
        console.log("1. Attempting Login...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'shashwatdixit33@gmail.com',
                password: 'Abc@123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            throw new Error(`Login Failed: ${loginRes.status} ${JSON.stringify(loginData)}`);
        }

        const token = loginData.token;
        console.log('Login successful.');

        // 2. Add Product
        const payload = {
            products: [
                {
                    name: "API Test Product",
                    brand: "APIBrand",
                    shopType: "GROCERY_KIRANA",
                    category: "General",
                    subCategory: "General Provision / Kirana",
                    unit: "packet",
                    quantity: 10,
                    pricePerUnit: 50,
                    // Minimal required fields based on Schema
                }
            ]
        };

        console.log("2. Sending Add Inventory Request...");
        const res = await fetch('http://localhost:5000/api/seller/inventory/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('Add Product Response:', res.status, JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Script Error:', error.message);
    }
}

testAddProduct();
