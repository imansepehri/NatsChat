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

// Make NATS connection optional
builder.Services.AddSingleton(sp =>
{
    try
    {
        var natsUrl = builder.Configuration["Nats:Url"] ?? "nats://localhost:4222";
        var opts = new NatsOpts { Url = natsUrl };
        return new NatsConnection(opts);
    }
    catch
    {
        // Return null if NATS connection fails
        return null;
    }
});

// Only add NATS subscriber if connection is available
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

// Endpoint to send messages via HTTP POST
app.MapPost("/send", async (HttpContext context, ChatHistoryService.Data.ChatDbContext db, CancellationToken ct) =>
{
    try
    {
        // Read request body manually
        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync(ct);
        
        // Parse JSON manually
        var message = System.Text.Json.JsonSerializer.Deserialize<ChatHistoryService.Models.IncomingMessage>(body);
        
        if (message == null)
        {
            return Results.BadRequest(new { error = "Invalid message format" });
        }

        // Save to database
        var entity = new ChatHistoryService.Models.ChatMessageEntity
        {
            Id = message.Id,
            RoomId = message.RoomId,
            User = message.User,
            Content = message.Content,
            Timestamp = message.Timestamp
        };
        
        db.Messages.Add(entity);
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { success = true, message = "Message saved successfully" });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.Run();


