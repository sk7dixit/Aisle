/**
 * CALCULATE SHOP STATUS (SINGLE SOURCE OF TRUTH)
 * 
 * Precedence Order:
 * 1. Manual OFFLINE (Always wins)
 * 2. Manual ONLINE (Override schedule)
 * 3. Scheduled Time (Default behavior)
 */
const deriveShopStatus = (shopDetails) => {
    if (!shopDetails) return 'OFFLINE';

    const {
        manualOverride = false,
        isManuallyOpen = false,
        autoScheduleEnabled = true,
        openingTime = '09:00',
        closingTime = '22:00'
    } = shopDetails;

    // 1. Manual Override - WHO is in control?
    if (manualOverride) {
        return isManuallyOpen ? 'ONLINE' : 'OFFLINE';
    }

    // 2. Auto Schedule - SHOULD time logic apply?
    // Note: If manualOverride is false, we imply autoSchedule is likely true/active unless specifically disabled without manual override (which is the "Closed" state in strict matrix).
    // The requirement says: "If autoScheduleEnabled -> isWithinSchedule".
    // "If !manualOverride && !autoScheduleEnabled -> CLOSED".

    if (autoScheduleEnabled) {
        // Force India Time (IST) for calculations to align with user expectations
        const now = new Date();
        const istString = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
        const [ih, im] = istString.split(':').map(Number);

        const currentMinutes = ih * 60 + im;

        const [oh, om] = (openingTime || '09:00').toString().split(':').map(Number);
        const [ch, cm] = (closingTime || '22:00').toString().split(':').map(Number);

        const openMinutes = oh * 60 + om;
        const closeMinutes = ch * 60 + cm;

        console.log(`[ShopStatus] Checking: Now=${now.toLocaleTimeString()} (${currentMinutes}m), Range=${openingTime}(${openMinutes}m)-${closingTime}(${closeMinutes}m)`);

        // Handle overnight (e.g., 22:00 to 02:00)
        if (closeMinutes < openMinutes) {
            if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
                return 'ONLINE';
            }
        } else {
            if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
                return 'ONLINE';
            }
        }
    }

    return 'OFFLINE'; // Default Closed
};

module.exports = { deriveShopStatus };
