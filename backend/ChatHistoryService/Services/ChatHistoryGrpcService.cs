using Chat;
using Grpc.Core;
using Microsoft.EntityFrameworkCore;

namespace ChatHistoryService.Services;

public class ChatHistoryGrpcService : Chat.ChatHistoryService.ChatHistoryServiceBase
{
    private readonly Data.ChatDbContext _dbContext;

    public ChatHistoryGrpcService(Data.ChatDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public override async Task<GetRecentMessagesResponse> GetRecentMessages(GetRecentMessagesRequest request, ServerCallContext context)
    {
        var limit = request.Limit <= 0 ? 50 : Math.Min(request.Limit, 200);

        var items = await _dbContext.Messages
            .Where(m => m.RoomId == request.RoomId)
            .OrderByDescending(m => m.Timestamp)
            .Take(limit)
            .ToListAsync(context.CancellationToken);

        var response = new GetRecentMessagesResponse();
        response.Messages.AddRange(items.Select(m => new ChatMessage
        {
            Id = m.Id,
            RoomId = m.RoomId,
            User = m.User,
            Content = m.Content,
            Timestamp = m.Timestamp
        }));

        return response;
    }
}


