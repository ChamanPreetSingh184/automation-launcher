namespace AutomationAgent.Models;

public class TaskExecutionResult
{
    public string TaskId { get; set; } = "";
    public string TaskName { get; set; } = "";
    public TaskType Type { get; set; }
    public TaskExecutionStatus Status { get; set; } = TaskExecutionStatus.Pending;
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    /// <summary>Human-readable message. Never a raw exception - see Executors for the mapping.</summary>
    public string? ErrorMessage { get; set; }
}

public enum ExecutionStatus
{
    Running,
    Completed,
    CompletedWithErrors,
    Failed,
}

public class ExecutionRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ProfileId { get; set; } = "";
    public string ProfileName { get; set; } = "";
    public string TriggeredBy { get; set; } = "Manual"; // "Manual" or "Startup"
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
    public ExecutionStatus Status { get; set; } = ExecutionStatus.Running;
    public List<TaskExecutionResult> TaskResults { get; set; } = [];
}
