import Message from '../models/Message.js';
import { canChat } from '../utils/chatAccess.js';

// Conversation history between the logged-in user and one other user.
export const getConversation = async (req, res) => {
  try {
    const me = req.user._id;
    const other = req.params.otherUserId;

    if (!(await canChat(me, other))) {
      return res.status(403).json({ error: 'You cannot view this conversation.' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
};
