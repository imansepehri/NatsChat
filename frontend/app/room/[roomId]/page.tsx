import ChatUI from '@/components/ChatUI';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <ChatUI roomId={params.roomId} />
    </main>
  );
}


