"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { connect, NatsConnection } from "nats.ws";
import clsx from 'clsx';

type Message = {
  id: string;
  roomId: string;
  user: string;
  content: string;
  timestamp: number;
};

async function initNats(): Promise<NatsConnection> {
  const url = process.env.NEXT_PUBLIC_NATS_WS_URL || 'ws://127.0.0.1:5080';
  return await connect({
    servers: url,
    maxReconnectAttempts: 8,
    reconnectTimeWait: 1000,
  });
}

export default function ChatUI({ roomId }: { roomId: string }) {
  const [conn, setConn] = useState<NatsConnection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState<string>('کاربر');
  const [text, setText] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [connError, setConnError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    let closed = false;
    (async () => {
      try {
        const c = await initNats();
        if (closed) { await c.close(); return; }
        setConn(c);
        setConnected(true);
        setConnError(null);

        // Load history via API route
        fetch(`/api/history?roomId=${encodeURIComponent(roomId)}`).then(res => res.json()).then((data) => {
          setMessages(data.messages ?? []);
        }).catch(() => {});

        const sub = c.subscribe(`chat.room.${roomId}`);
        (async () => {
          for await (const m of sub) {
            try {
              const parsed = JSON.parse(new TextDecoder().decode(m.data)) as Message;
              setMessages(prev => {
                if (prev.some(x => x.id === parsed.id)) return prev;
                return [...prev, parsed].sort((a,b) => a.timestamp - b.timestamp);
              });
            } catch {}
          }
        })();
      } catch (e) {
        console.error('NATS connect error', e);
        setConnected(false);
        setConnError('اتصال به NATS برقرار نشد. مطمئن شوید NATS با WebSocket روی پورت 5080 اجراست.');
      }
    })();
    return () => {
      closed = true;
      conn?.close();
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function send() {
    if (!conn || !text.trim()) return;
    const msg: Message = {
      id: crypto.randomUUID(),
      roomId,
      user: name || 'کاربر',
      content: text,
      timestamp: Date.now()
    };
    // Optimistic append; subscription will dedupe on echo
    setMessages(prev => prev.some(x => x.id === msg.id) ? prev : [...prev, msg]);
    await conn.publish(`chat.room.${roomId}`, JSON.stringify(msg));
    setText('');
  }

  const header = useMemo(() => (
    <div className="flex items-center justify-between p-3 border-b border-white/10">
      <div className="font-semibold">اتاق: {roomId}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
          connected ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}> 
          <span className={clsx("h-2 w-2 rounded-full",
            connected ? "bg-green-400" : "bg-red-400")} />
          {connected ? 'متصل به NATS' : 'عدم اتصال'}
        </span>
        <span className="text-gray-400 hidden sm:inline">NATS + gRPC</span>
      </div>
    </div>
  ), [roomId, connected]);

  return (
    <div className="flex flex-col h-[80vh] bg-[var(--panel)] rounded-lg shadow-lg overflow-hidden">
      {header}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={clsx("max-w-[80%] rounded-lg px-3 py-2", m.user === name ? "ml-auto bg-indigo-600 text-white" : "bg-white/5")}> 
            <div className="text-xs text-gray-300 mb-1">{m.user}</div>
            <div>{m.content}</div>
            <div className="text-[10px] text-gray-400 mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-white/10 space-y-2">
        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 rounded px-3 py-2 outline-none" placeholder="نام شما" />
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} className="flex-1 bg-white/5 rounded px-3 py-2 outline-none" placeholder="پیام خود را بنویسید" />
          <button onClick={send} disabled={!connected} className={clsx("rounded px-4 py-2", connected ? "bg-indigo-600 hover:bg-indigo-500" : "bg-gray-600 cursor-not-allowed")}>ارسال</button>
        </div>
        {connError && <div className="text-xs text-red-300">{connError}</div>}
      </div>
    </div>
  );
}


