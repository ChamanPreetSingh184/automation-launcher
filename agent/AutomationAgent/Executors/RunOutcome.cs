using AutomationAgent.Models;

namespace AutomationAgent.Executors;

public record RunOutcome(bool Started, ExecutionRecord? Record, string? Error)
{
    public static RunOutcome AlreadyRunning() => new(false, null, "Automation is already running.");
    public static RunOutcome Failed(string message) => new(false, null, message);
    public static RunOutcome Success(ExecutionRecord record) => new(true, record, null);
}
