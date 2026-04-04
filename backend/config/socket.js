let io;

const initSocket = (server) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173", // Frontend URL
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 New Client Connected: ${socket.id}`);

        // Join Seller Room (Seller Dashboard)
        socket.on("seller:join", (sellerId) => {
            if (!sellerId) return;
            socket.join(sellerId);
            console.log(`🛒 Seller Joined Room: ${sellerId}`);
        });

        // Customer Join Shop Room (Real-time Status)
        socket.on("customer:join_shop", (shopId) => {
            if (!shopId) return;
            const room = `shop_${shopId}`;
            socket.join(room);
            console.log(`👀 Customer Joined Shop Room: ${room}`);
        });

        socket.on("disconnect", () => {
            console.log("❌ Client Disconnected");
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIO };
