const { deriveShopStatus } = require('./utils/shopStatusUtils');

const mockNow = (hours, minutes) => {
    // Inject a fake time into Date for testing
    const originalDate = global.Date;
    global.Date = class extends originalDate {
        constructor() {
            super();
            this.setHours(hours);
            this.setMinutes(minutes);
        }
    };
    return () => { global.Date = originalDate; }; // cleanup
};

const runTests = () => {
    console.log("--- STARTING SHOP STATUS VERIFICATION ---\n");

    const baseShop = {
        openingTime: '09:00',
        closingTime: '20:00',
        isManuallyOffline: false,
        isManuallyOnline: false
    };

    // TEST 1: Schedule Default (ONLINE)
    {
        const cleanup = mockNow(10, 0); // 10:00 AM
        const status = deriveShopStatus(baseShop);
        console.log(`[TEST 1] 10:00 AM (Schedule: 09:00-20:00) -> Expected: ONLINE, Got: ${status}`);
        cleanup();
    }

    // TEST 2: Schedule Default (OFFLINE - Before)
    {
        const cleanup = mockNow(7, 0); // 7:00 AM
        const status = deriveShopStatus(baseShop);
        console.log(`[TEST 2] 07:00 AM (Schedule: 09:00-20:00) -> Expected: OFFLINE, Got: ${status}`);
        cleanup();
    }

    // TEST 3: Schedule Default (OFFLINE - After)
    {
        const cleanup = mockNow(21, 0); // 9:00 PM
        const status = deriveShopStatus(baseShop);
        console.log(`[TEST 3] 09:00 PM (Schedule: 09:00-20:00) -> Expected: OFFLINE, Got: ${status}`);
        cleanup();
    }

    // TEST 4: Manual OFFLINE Override (Precedence 1)
    {
        const cleanup = mockNow(10, 0); // Mid-day
        const shop = { ...baseShop, isManuallyOffline: true };
        const status = deriveShopStatus(shop);
        console.log(`[TEST 4] 10:00 AM + Manual OFFLINE -> Expected: OFFLINE, Got: ${status}`);
        cleanup();
    }

    // TEST 5: Manual ONLINE Override (Precedence 2)
    {
        const cleanup = mockNow(22, 0); // Late night
        const shop = { ...baseShop, isManuallyOnline: true };
        const status = deriveShopStatus(shop);
        console.log(`[TEST 5] 10:00 PM + Manual ONLINE -> Expected: ONLINE, Got: ${status}`);
        cleanup();
    }

    // TEST 6: Manual Conflict (OFFLINE vs ONLINE)
    {
        const cleanup = mockNow(10, 0);
        const shop = { ...baseShop, isManuallyOffline: true, isManuallyOnline: true };
        const status = deriveShopStatus(shop);
        console.log(`[TEST 6] Manual OFFLINE + Manual ONLINE -> Expected: OFFLINE (offline wins), Got: ${status}`);
        cleanup();
    }

    // TEST 7: Overnight Schedule (22:00 to 02:00)
    {
        const overnightShop = { ...baseShop, openingTime: '22:00', closingTime: '02:00' };

        let c1 = mockNow(23, 0);
        let s1 = deriveShopStatus(overnightShop);
        console.log(`[TEST 7a] 11:00 PM (Schedule: 22:00-02:00) -> Expected: ONLINE, Got: ${s1}`);
        c1();

        let c2 = mockNow(1, 0);
        let s2 = deriveShopStatus(overnightShop);
        console.log(`[TEST 7b] 01:00 AM (Schedule: 22:00-02:00) -> Expected: ONLINE, Got: ${s2}`);
        c2();

        let c3 = mockNow(3, 0);
        let s3 = deriveShopStatus(overnightShop);
        console.log(`[TEST 7c] 03:00 AM (Schedule: 22:00-02:00) -> Expected: OFFLINE, Got: ${s3}`);
        c3();
    }

    console.log("\n--- VERIFICATION COMPLETE ---");
};

runTests();
