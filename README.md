## Jalali Chat – gRPC + NATS + Next.js

- Backend: .NET 8 gRPC with SQLite, NATS subscriber (JetStream-ready)
- Frontend: Next.js 14 + Tailwind, NATS over WebSocket
- Realtime: NATS subjects `chat.room.<roomId>`

### Run with Docker
```bash
docker compose up --build
```

Open `http://localhost:3000/room/general`.

Services:
- NATS: `4222` (client), `5080` (WebSocket), `8222` (monitor)
- Chat History gRPC/REST: `5001`
- Next.js: `3000`

### Env
- Frontend:
  - `NEXT_PUBLIC_NATS_WS_URL=ws://localhost:5080`
  - `GRPC_CHAT_HISTORY_URL=chat-history:5001`
- Backend:
  - `Nats:Url=nats://nats:4222`
  - `ConnectionStrings:Default=Data Source=chat.db`

### Notes
- Local dev uses insecure endpoints (no TLS). Add auth/TLS for production.


