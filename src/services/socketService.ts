import { io } from 'socket.io-client';
import { socketUrl } from '../var/config';

// Assumes Socket.IO is hosted behind the same prefix as the REST API.
// Change url/path here if the server uses a different host or proxy route.
export const socketConfig = {
  url: socketUrl,
  path: `${socketUrl
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/\/$/, '')}/socket.io`,
};

// Import this same instance in screens/services; do not create per-screen clients.
export const socket = io(socketConfig.url, {
  path: socketConfig.path,
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
});

let currentToken: string | null = null;

export function disconnectSocket() {
  socket.disconnect();
  // Prevent queued events from a previous session reaching another account.
  socket.sendBuffer.length = 0;
  socket.receiveBuffer.length = 0;
  socket.auth = {};
  currentToken = null;
}

export function connectSocket(token: string) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    disconnectSocket();
    console.log('Socket disconnected');
    return;
  }

  if (currentToken !== normalizedToken) {
    disconnectSocket();
    currentToken = normalizedToken;
    // Must match the server's socket.handshake.auth contract.
    socket.auth = { token: normalizedToken };
  }

  if (!socket.connected && !socket.active) {
    socket.connect();
    console.log('Socket connected');
  }
}
