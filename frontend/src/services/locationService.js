export async function detectUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Geolocation not supported");
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const response = await fetch(
                        `/api/location/reverse?lat=${latitude}&lng=${longitude}`
                    );

                    if (!response.ok) {
                        throw new Error("Location API failed");
                    }

                    const data = await response.json();

                    if (!data.city) {
                        reject("City not found");
                        return;
                    }

                    localStorage.setItem(
                        "userLocation",
                        JSON.stringify(data)
                    );

                    resolve(data);

                } catch (error) {
                    console.error("Location detection error:", error);
                    reject("Location request failed");
                }
            },
            () => reject("Permission denied")
        );
    });
}
