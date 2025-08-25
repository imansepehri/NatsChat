import { NextRequest, NextResponse } from 'next/server';
import { broadcastMessage } from '../events/route';

export async function POST(request: NextRequest) {
  try {
    const message = await request.json();
    
    // Send message to backend
    const response = await fetch('http://localhost:5001/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    // Broadcast message to all connected clients via SSE
    broadcastMessage(message.roomId, {
      type: 'new_message',
      message: message
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
