import { io } from 'socket.io-client';
import { API_URL, getStoredUser } from './api';

let socket = null;

/** One shared, authenticated connection for the whole app. */
export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      // A function, so reconnects always use the current token.
      auth: (cb) => cb({ token: getStoredUser()?.token }),
    });
  }
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
