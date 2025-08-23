import { NextRequest, NextResponse } from 'next/server';
// Generated types would be ideal; for demo, define minimal interfaces
type ChatMessage = { id: string; roomId: string; user: string; content: string; timestamp: number };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId') || 'general';
  const limit = Number(searchParams.get('limit') || 50);

  // Avoid grpc-web complexity by adding a tiny passthrough: we use JSON over HTTP on the same service.
  // But since backend exposes only gRPC in this demo, we'll return empty if grpc-web isn't configured.
  // To keep it functional, we will fetch from a simple REST shim path if provided.
  const grpcHost = process.env.GRPC_CHAT_HISTORY_URL || 'localhost:5001';

  try {
    // Attempt a naive fetch to a shim if exists
    const resp = await fetch(`http://${grpcHost}/history?roomId=${encodeURIComponent(roomId)}&limit=${limit}`);
    if (resp.ok) {
      const data = await resp.json();
      return NextResponse.json({ messages: data.messages as ChatMessage[] });
    }
  } catch {}

  // Fallback empty
  return NextResponse.json({ messages: [] });
}


