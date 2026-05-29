import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { useSelector } from 'react-redux';
import UserAvatar from '../common/UserAvatar';

const ChatPanel = ({ socket, roomId }) => {
  const { user } = useSelector(state => state.auth);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-chat', roomId);

    socket.on('chat-history', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });

    socket.on('user-typing', ({ user: typist, isTyping }) => {
      if (isTyping) {
        setTypingUser(`${typist} is typing...`);
      } else {
        setTypingUser(null);
      }
    });

    return () => {
      socket.off('chat-history');
      socket.off('receive-message');
      socket.off('user-typing');
    };
  }, [socket, roomId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('send-message', { roomId, text: input });
    setInput('');
    socket.emit('typing', { roomId, isTyping: false });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket.emit('typing', { roomId, isTyping: true });
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { roomId, isTyping: false });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full w-80 border-l border-border bg-surface shrink-0 z-20">
      <div className="h-12 border-b border-border flex items-center px-4 font-semibold text-text">
        Meeting Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        {messages.map((msg, i) => {
          const isMe = msg.sender?._id === user.id;
          return (
            <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <UserAvatar name={msg.sender?.name} src={msg.sender?.avatar} size="sm" />
              <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <span className="text-xs text-textSecondary mb-1">{isMe ? 'You' : msg.sender?.name}</span>
                <div className={`px-3 py-2 rounded-lg text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface border border-border text-text rounded-tl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {typingUser && (
        <div className="px-4 py-1 text-xs text-textSecondary italic animate-pulse bg-background/50 border-t border-border">
          {typingUser}
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 border-t border-border bg-surface flex items-center gap-2">
        <button type="button" className="text-textSecondary hover:text-primary transition-colors"><Smile size={20} /></button>
        <input 
          type="text" 
          value={input} 
          onChange={handleTyping} 
          placeholder="Type a message..." 
          className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
        <button type="submit" disabled={!input.trim()} className="bg-primary text-white p-2 rounded-full disabled:opacity-50 hover:bg-opacity-90 transition-all hover:scale-105 active:scale-95">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
