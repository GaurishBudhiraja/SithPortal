import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = (userId: string) => {
  socket.connect();
  socket.emit('user_connected', userId);
};

export const disconnectSocket = () => {
  socket.disconnect();
};