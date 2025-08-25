import { NextRequest, NextResponse } from 'next/server';

// Store active SSE connections per room
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the room
      if (!connections.has(roomId)) {
        connections.set(roomId, new Set());
      }
      connections.get(roomId)!.add(controller);

      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', roomId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        connections.get(roomId)?.delete(controller);
        if (connections.get(roomId)?.size === 0) {
          connections.delete(roomId);
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Function to broadcast messages to all connections in a room
export function broadcastMessage(roomId: string, message: any) {
  const roomConnections = connections.get(roomId);
  if (!roomConnections) return;

  const data = `data: ${JSON.stringify(message)}\n\n`;
  const encoded = new TextEncoder().encode(data);

  roomConnections.forEach(controller => {
    try {
      controller.enqueue(encoded);
    } catch (error) {
      // Remove dead connections
      roomConnections.delete(controller);
    }
  });

  // Clean up empty rooms
  if (roomConnections.size === 0) {
    connections.delete(roomId);
  }
}

