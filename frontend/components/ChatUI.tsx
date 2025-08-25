"use client";
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

type Message = {
  id: string;
  roomId: string;
  user: string;
  content: string;
  timestamp: number;
};

export default function ChatUI({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Get username from localStorage
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      setName(savedUsername);
    } else {
      // Redirect to home if no username
      window.location.href = '/';
      return;
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!name) return; // Don't setup chat until username is loaded
    
    // Load initial chat history once
    loadHistory();
    
    // Setup SSE connection for real-time updates
    setupSSE();
    
    return () => {
      // Cleanup SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [roomId, name]);

  function setupSSE() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/events?roomId=${encodeURIComponent(roomId)}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection established');
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('Connected to chat room:', data.roomId);
        } else if (data.type === 'new_message') {
          const newMessage = data.message;
          // Only add if not already exists
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setSseConnected(false);
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          setupSSE();
        }
      }, 3000);
    };
  }

  async function loadHistory() {
    try {
      const response = await fetch(`/api/history?roomId=${encodeURIComponent(roomId)}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setConnected(true);
        setConnError(null);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setConnected(false);
      setConnError('اتصال به سرور برقرار نشد. مطمئن شوید بک‌اند در حال اجراست.');
    }
  }

  async function send() {
    if (!text.trim()) return;
    
    const msg: Message = {
      id: crypto.randomUUID(),
      roomId,
      user: name,
      content: text,
      timestamp: Date.now()
    };

    try {
      // Add message locally first (optimistic update)
      setMessages(prev => [...prev, msg]);
      setText('');

      // Send message via API
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });

      if (!response.ok) {
        // If failed, remove the message and show error
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        setConnError('خطا در ارسال پیام');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the message if failed
      setMessages(prev => prev.filter(m => m.id !== msg.id));
      setConnError('خطا در ارسال پیام');
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (!name) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">اتاق {roomId}</h1>
              <p className="text-sm text-gray-300">کاربر: {name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadHistory}
              className="px-3 py-1 text-sm bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-full transition-colors"
            >
              تازه‌سازی
            </button>
            <span className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm",
              connected ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}> 
              <span className={clsx("h-2 w-2 rounded-full",
                connected ? "bg-green-400" : "bg-red-400")} />
              {connected ? 'متصل' : 'عدم اتصال'}
            </span>
            <span className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm",
              sseConnected ? "bg-blue-500/20 text-blue-300" : "bg-yellow-500/20 text-yellow-300")}> 
              <span className={clsx("h-2 w-2 rounded-full",
                sseConnected ? "bg-blue-400" : "bg-yellow-400")} />
              {sseConnected ? 'Real-time' : 'Polling'}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('chatUsername');
                window.location.href = '/';
              }}
              className="px-3 py-1 text-sm text-gray-300 hover:text-white transition-colors"
            >
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>هنوز پیامی ارسال نشده است</p>
            <p className="text-sm mt-2">اولین پیام را ارسال کنید!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.user === name;
            const showUserInfo = index === 0 || messages[index - 1]?.user !== message.user;
            
            return (
              <div key={message.id} className={clsx("flex", isOwnMessage ? "justify-end" : "justify-start")}>
                <div className={clsx("max-w-xs lg:max-w-md", isOwnMessage ? "order-2" : "order-1")}>
                  {!isOwnMessage && showUserInfo && (
                    <div className="text-sm text-gray-400 mb-1 mr-2">{message.user}</div>
                  )}
                  <div className={clsx("px-4 py-3 rounded-2xl shadow-lg",
                    isOwnMessage 
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md" 
                      : "bg-white/10 text-white rounded-bl-md border border-white/20"
                  )}>
                    <div className="text-sm">{message.content}</div>
                    <div className={clsx("text-xs mt-2 opacity-70",
                      isOwnMessage ? "text-right" : "text-left"
                    )}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-6">
        <div className="max-w-4xl mx-auto">
          {connError && (
            <div className="text-red-400 text-sm text-center mb-3">{connError}</div>
          )}
          <div className="flex space-x-4">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <button
              onClick={send}
              disabled={!connected || !text.trim()}
              className={clsx("px-6 py-3 rounded-xl font-semibold transition-all duration-200",
                connected && text.trim()
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transform hover:scale-105"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              )}
            >
              ارسال
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


