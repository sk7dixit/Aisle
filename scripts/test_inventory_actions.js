async function testInventoryActions() {
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
        const shopType = loginData.user?.shopDetails?.shopType || 'GROCERY_KIRANA';
        console.log(`Login successful. Shop Type: ${shopType}`);

        // 2. Add Product (Setup)
        const timestamp = Date.now();
        const payload = {
            products: [
                {
                    name: `Update Test Product ${timestamp}`,
                    brand: "TestBrand",
                    shopType: shopType,
                    category: "General",
                    subCategory: "General Provision / Kirana",
                    unit: "packet",
                    quantity: 10,
                    pricePerUnit: 50
                }
            ]
        };

        const addRes = await fetch('http://localhost:5000/api/seller/inventory/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const addData = await addRes.json();
        console.log('Add Product Response:', addRes.status, JSON.stringify(addData, null, 2));

        // Get Product ID (assume first one created/merged)
        // Note: The bulk add response structure depends slightly on the controller logic.
        // It returns { message, summary: { created: N, merged: N, errors: [] } }
        // It DOES NOT return the IDs of created products in the simplified response.
        // So we need to fetch inventory to find it.

        console.log("3. Fetching Inventory to get Product ID...");
        const invRes = await fetch(`http://localhost:5000/api/seller/inventory`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const invDataRaw = await invRes.json();
        // Assuming the API returns an array, sort by createdAt desc if not already
        const invData = invDataRaw.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (invData.length === 0) {
            throw new Error("Inventory is empty.");
        }

        const product = invData[0];
        console.log(`Found Product: ${product._id} (${product.name})`);

        // 3. Test UPDATE QUANTITY (PATCH)
        console.log("4. Testing PATCH /inventory/:id/quantity (+1)...");
        const patchRes = await fetch(`http://localhost:5000/api/seller/inventory/${product._id}/quantity`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ change: 1, reason: "Test Script" })
        });

        console.log(`PATCH Response: ${patchRes.status}`);
        if (!patchRes.ok) {
            console.log("PATCH Body:", await patchRes.text());
        } else {
            console.log("PATCH Success:", await patchRes.json());
        }

        // 4. Test UPDATE DETAILS (PUT)
        console.log("5. Testing PUT /products/:id (Edit Code)...");
        const putRes = await fetch(`http://localhost:5000/api/seller/products/${product._id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `Updated Name ${timestamp}`,
                sellingPrice: 60
            })
        });

        console.log(`PUT Response: ${putRes.status}`);
        if (!putRes.ok) {
            console.log("PUT Body:", await putRes.text());
        } else {
            console.log("PUT Success:", await putRes.json());
        }

    } catch (error) {
        console.error('Script Error:', error.message);
        if (error.cause) console.error(error.cause);
    }
}

testInventoryActions();
