import { io } from 'socket.io-client';

// Use environment variable or default to localhost:5000 (Backend Port)
// Vite uses import.meta.env for environment variables
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true, // Important for session/cookies if used
    transports: ['websocket', 'polling'] // Prefer websocket
});
