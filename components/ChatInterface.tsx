import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, MessageSquare, Loader2 } from 'lucide-react';
import { generateGreatWallGuide } from '../services/geminiService';
import { ChatMessage, SceneTime } from '../types';

interface ChatInterfaceProps {
  timeOfDay: SceneTime;
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ timeOfDay, isOpen, onToggle }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Welcome to the Great Wall! I am your Lego Historian. It is currently ${timeOfDay} time here. Ask me anything about the wall's construction, history, or myths!`,
      timestamp: Date.now(),
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = `Time of day: ${timeOfDay}. The user is looking at a procedural LEGO model of the Great Wall, showing watchtowers on varied terrain.`;
      const responseText = await generateGreatWallGuide([...messages, userMsg], context);
      
      const modelMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-6 right-6 bg-yellow-500 hover:bg-yellow-400 text-black p-4 rounded-full shadow-xl transition-all transform hover:scale-110 z-50 border-4 border-yellow-600"
      >
        <MessageSquare size={28} strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border-4 border-yellow-500">
      {/* Header */}
      <div className="bg-yellow-500 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-900" size={20} />
          <h2 className="font-bold text-yellow-900 text-lg tracking-wide">Lego Historian</h2>
        </div>
        <button onClick={onToggle} className="text-yellow-900 hover:text-black transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-stone-800 border-2 border-stone-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-stone-100 p-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-stone-500 text-xs">
                <Loader2 className="animate-spin" size={14} />
                <span>Consulting the ancient scrolls...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-stone-100 border-t border-stone-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about the Great Wall..."
            className="flex-1 px-4 py-2 rounded-full border-2 border-stone-300 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-stone-400 text-white p-2 rounded-full shadow-md transition-transform active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
