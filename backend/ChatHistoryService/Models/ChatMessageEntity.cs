namespace ChatHistoryService.Models;

public class ChatMessageEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RoomId { get; set; } = string.Empty;
    public string User { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public long Timestamp { get; set; }
}

public class IncomingMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RoomId { get; set; } = string.Empty;
    public string User { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public long Timestamp { get; set; }
}


