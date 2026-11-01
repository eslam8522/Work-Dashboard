import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

export default function ChatBox({ receiverId, receiverRole }) {
  const { user } = useAuth();
  const myId = user?._id;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef(null);

  // Load history, then listen for new messages from the person on the other end.
  useEffect(() => {
    if (!receiverId) return undefined;
    let cancelled = false;

    api
      .get(`/api/messages/${receiverId}`)
      .then((res) => !cancelled && setMessages(res.data))
      .catch(() => !cancelled && setError('Could not load the conversation.'));

    const socket = getSocket();
    const onReceive = (message) => {
      if (String(message.senderId) !== String(receiverId)) return;
      setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
    };
    socket.on('receiveMessage', onReceive);

    return () => {
      cancelled = true;
      socket.off('receiveMessage', onReceive);
    };
  }, [receiverId]);

  // Keep the newest message in view (scrolls the chat box only, never the page).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setError('');

    getSocket().emit('sendMessage', { receiverId, text: body }, (res) => {
      if (res?.error) return setError(res.error);
      setMessages((prev) => [...prev, res.message]);
      setText('');
    });
  };

  if (!receiverId) return <p className="muted">Chat is unavailable for this study.</p>;

  return (
    <section className="chat" aria-label={`Chat with ${receiverRole}`}>
      <div className="chat__header">Chat with {receiverRole}</div>

      <div className="chat__messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && <p className="chat__empty">No messages yet. Say hello!</p>}
        {messages.map((msg) => (
          <div key={msg._id} className={`chat__bubble${String(msg.senderId) === String(myId) ? ' chat__bubble--mine' : ''}`}>
            {msg.text}
          </div>
        ))}
      </div>

      {error && <p className="chat__error" role="alert">{error}</p>}

      <form className="chat__form" onSubmit={handleSend}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={1000}
          aria-label="Message"
        />
        <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Send</button>
      </form>
    </section>
  );
}
