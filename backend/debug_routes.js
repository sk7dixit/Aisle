try {
    console.log("Attempting to load customerRoutes...");
    const customerRoutes = require('./routes/customerRoutes');
    console.log("Successfully loaded customerRoutes!");
} catch (error) {
    console.error("FAILED to load customerRoutes:");
    console.error(error);
}
