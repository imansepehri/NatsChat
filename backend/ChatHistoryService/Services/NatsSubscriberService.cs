using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NATS.Client.Core;
using System.Text.Json;

namespace ChatHistoryService.Services;

public class NatsSubscriberService : BackgroundService
{
    private readonly NatsConnection? _nats;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NatsSubscriberService> _logger;

    public NatsSubscriberService(NatsConnection? nats, IServiceProvider serviceProvider, ILogger<NatsSubscriberService> logger)
    {
        _nats = nats;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_nats == null)
        {
            _logger.LogWarning("NATS connection not available, subscriber service will not run");
            return;
        }

        await foreach (var msg in _nats.SubscribeAsync<string>("chat.room.*", cancellationToken: stoppingToken))
        {
            try
            {
                if (string.IsNullOrWhiteSpace(msg.Data)) continue;
                var model = JsonSerializer.Deserialize<Models.IncomingMessage>(msg.Data);
                if (model is null) continue;

                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<Data.ChatDbContext>();
                db.Messages.Add(new Models.ChatMessageEntity
                {
                    Id = model.Id,
                    RoomId = model.RoomId,
                    User = model.User,
                    Content = model.Content,
                    Timestamp = model.Timestamp
                });
                await db.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist message from NATS.");
            }
        }
    }
}


