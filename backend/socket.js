import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Message from './models/Message.js';
import { canChat } from './utils/chatAccess.js';

export const initializeSocket = (httpServer, clientUrl) => {
  const io = new Server(httpServer, {
    cors: { origin: clientUrl, methods: ['GET', 'POST'] },
  });

  // Authenticate every connection with the same JWT the REST API uses.
  io.use(async (socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id isBlocked');
      if (!user || user.isBlocked) return next(new Error('Not authorized'));
      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    // Every user has a private room, so multiple tabs/devices all receive messages.
    socket.join(socket.data.userId);

    socket.on('sendMessage', async ({ receiverId, text } = {}, ack = () => {}) => {
      try {
        const body = String(text || '').trim();
        if (!body || body.length > 1000) return ack({ error: 'Message must be 1-1000 characters.' });

        if (!(await canChat(socket.data.userId, receiverId))) {
          return ack({ error: 'You cannot message this user.' });
        }

        // senderId comes from the verified token, so it cannot be spoofed.
        const message = await Message.create({ senderId: socket.data.userId, receiverId, text: body });
        io.to(String(receiverId)).emit('receiveMessage', message);
        ack({ message });
      } catch (error) {
        console.error('sendMessage failed:', error.message);
        ack({ error: 'Could not send message.' });
      }
    });
  });

  return io;
};
