using Chat;
using Microsoft.EntityFrameworkCore;
using NATS.Client.Core;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddGrpc();

builder.Services.AddDbContext<ChatHistoryService.Data.ChatDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Default") ?? "Data Source=chat.db";
    options.UseSqlite(connectionString);
});

builder.Services.AddSingleton(sp =>
{
    var natsUrl = builder.Configuration["Nats:Url"] ?? "nats://localhost:4222";
    var opts = new NatsOpts { Url = natsUrl };
    return new NatsConnection(opts);
});

builder.Services.AddHostedService<ChatHistoryService.Services.NatsSubscriberService>();

var app = builder.Build();

// Ensure database exists
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ChatHistoryService.Data.ChatDbContext>();
    db.Database.EnsureCreated();
}

app.MapGrpcService<ChatHistoryService.Services.ChatHistoryGrpcService>();
app.MapGet("/", () => "Chat History gRPC Service running");

// Simple REST shim to fetch history from Next.js API without grpc-web
app.MapGet("/history", async (string roomId, int? limit, ChatHistoryService.Data.ChatDbContext db, CancellationToken ct) =>
{
    var take = limit is null or <= 0 ? 50 : Math.Min(limit.Value, 200);
    var items = await db.Messages
        .Where(m => m.RoomId == roomId)
        .OrderByDescending(m => m.Timestamp)
        .Take(take)
        .ToListAsync(ct);

    var messages = items
        .OrderBy(m => m.Timestamp)
        .Select(m => new
        {
            id = m.Id,
            roomId = m.RoomId,
            user = m.User,
            content = m.Content,
            timestamp = m.Timestamp
        });

    return Results.Json(new { messages });
});

app.Run();


