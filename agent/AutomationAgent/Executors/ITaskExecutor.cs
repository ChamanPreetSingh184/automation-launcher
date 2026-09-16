using AutomationAgent.Models;

namespace AutomationAgent.Executors;

public record TaskExecutionOutcome(TaskExecutionStatus Status, string? ErrorMessage = null)
{
    public static TaskExecutionOutcome Completed() => new(TaskExecutionStatus.Completed);
    public static TaskExecutionOutcome Failed(string message) => new(TaskExecutionStatus.Failed, message);
}

/// <summary>One implementation per TaskType. Must never throw - always return a Failed outcome instead.</summary>
public interface ITaskExecutor
{
    Task<TaskExecutionOutcome> ExecuteAsync(AutomationTask task, CancellationToken cancellationToken);
}
