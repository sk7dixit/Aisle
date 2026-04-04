const testInterest = async () => {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await fetch('http://127.0.0.1:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'shashwatdixit22@gmail.com',
                password: 'Msd@123'
            })
        });
        const loginData = await loginRes.json();
        
        if (!loginRes.ok) throw new Error(loginData.message);
        
        const token = loginData.token;
        console.log('Login Successful');

        // 2. Toggle Interest (Add)
        console.log('Adding "Pharmacy near me"...');
        const res1 = await fetch('http://127.0.0.1:5001/api/customer/interest', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ label: "Pharmacy near me" })
        });
        const data1 = await res1.json();
        console.log('Response 1:', data1.interestedIntents.map(i => i.label));

        // 3. Toggle Interest (Remove)
        console.log('Removing "Pharmacy near me"...');
        const res2 = await fetch('http://localhost:5001/api/customer/interest', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ label: "Pharmacy near me" })
        });
        const data2 = await res2.json();
        console.log('Response 2:', data2.interestedIntents.map(i => i.label));

    } catch (error) {
        console.error('Error:', error.message);
    }
};

testInterest();
