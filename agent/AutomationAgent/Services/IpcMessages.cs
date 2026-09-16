using System.Text.Json;

namespace AutomationAgent.Services;

/// <summary>One line of incoming JSON: {"id": "...", "command": "...", "payload": {...}}.</summary>
public class IpcRequest
{
    public string Id { get; set; } = "";
    public string Command { get; set; } = "";
    public JsonElement Payload { get; set; }
}

/// <summary>Reply to exactly one IpcRequest, matched on Id.</summary>
public record IpcResponse(string Type, string? Id, bool Ok, object? Data, string? Error);

/// <summary>Unsolicited progress message, e.g. one per task-status change during a run.</summary>
public record IpcEvent(string Type, string Event, string? RunId, object Data);

/// <summary>Thrown by a command handler for an expected, user-facing failure (message is shown as-is).</summary>
public class AgentRequestException(string message) : Exception(message);
