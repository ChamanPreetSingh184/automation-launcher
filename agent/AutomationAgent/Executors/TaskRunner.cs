using AutomationAgent.Logging;
using AutomationAgent.Models;
using AutomationAgent.Services;

namespace AutomationAgent.Executors;

/// <summary>
/// Runs one profile's tasks sequentially and records the result. Only one run
/// can be active at a time across the whole agent (the _isRunning flag is
/// shared by every caller, regardless of which IPC connection asked) - a
/// second RunAsync call while one is active returns RunOutcome.AlreadyRunning
/// immediately without touching the active run.
/// </summary>
public class TaskRunner(ProfileManager profileManager, ExecutionHistoryStore historyStore, AutomationLogger logger)
{
    private readonly Dictionary<TaskType, ITaskExecutor> _executors = new()
    {
        [TaskType.Application] = new ApplicationExecutor(),
        [TaskType.Url] = new UrlExecutor(),
        [TaskType.Chrome] = new ChromeExecutor(),
        [TaskType.Edge] = new EdgeExecutor(),
        [TaskType.Wait] = new WaitExecutor(),
    };

    private int _isRunning;

    public bool IsRunning => Interlocked.CompareExchange(ref _isRunning, 0, 0) == 1;

    public async Task<RunOutcome> RunAsync(
        string profileId,
        string triggeredBy,
        Action<TaskExecutionResult>? onTaskUpdate,
        CancellationToken cancellationToken)
    {
        if (Interlocked.CompareExchange(ref _isRunning, 1, 0) != 0)
        {
            return RunOutcome.AlreadyRunning();
        }

        try
        {
            var profile = profileManager.Get(profileId);
            if (profile is null)
            {
                return RunOutcome.Failed("Profile not found.");
            }

            var record = new ExecutionRecord
            {
                ProfileId = profile.Id,
                ProfileName = profile.Name,
                TriggeredBy = triggeredBy,
            };
            logger.Info("Profile started", profile.Name);

            var anyFailed = false;
            foreach (var task in profile.Tasks.OrderBy(t => t.Order))
            {
                var result = await RunOneTaskAsync(profile.Name, task, onTaskUpdate, cancellationToken);
                record.TaskResults.Add(result);
                anyFailed |= result.Status == TaskExecutionStatus.Failed;
            }

            record.Status = anyFailed ? ExecutionStatus.CompletedWithErrors : ExecutionStatus.Completed;
            record.CompletedAt = DateTimeOffset.UtcNow;
            historyStore.Save(record);
            logger.Info("Profile completed", profile.Name);

            return RunOutcome.Success(record);
        }
        finally
        {
            Interlocked.Exchange(ref _isRunning, 0);
        }
    }

    private async Task<TaskExecutionResult> RunOneTaskAsync(
        string profileName,
        AutomationTask task,
        Action<TaskExecutionResult>? onTaskUpdate,
        CancellationToken cancellationToken)
    {
        var result = new TaskExecutionResult { TaskId = task.Id, TaskName = task.Name, Type = task.Type };

        if (!task.Enabled)
        {
            result.Status = TaskExecutionStatus.Skipped;
            onTaskUpdate?.Invoke(result);
            logger.Info($"Skipped task (disabled): {task.Name}", profileName, task.Name);
            return result;
        }

        result.Status = TaskExecutionStatus.Running;
        result.StartedAt = DateTimeOffset.UtcNow;
        onTaskUpdate?.Invoke(result);
        logger.Info($"Starting task: {task.Name}", profileName, task.Name);

        TaskExecutionOutcome outcome;
        try
        {
            outcome = await _executors[task.Type].ExecuteAsync(task, cancellationToken);
        }
        catch (Exception ex)
        {
            // Defense in depth: executors are expected to catch their own errors, but one
            // misbehaving task must never take down the whole agent.
            outcome = TaskExecutionOutcome.Failed($"Unexpected error while running this task. ({ex.Message})");
        }

        result.Status = outcome.Status;
        result.ErrorMessage = outcome.ErrorMessage;
        result.CompletedAt = DateTimeOffset.UtcNow;
        onTaskUpdate?.Invoke(result);

        if (outcome.Status == TaskExecutionStatus.Failed)
        {
            logger.Error($"Task failed: {task.Name} - {outcome.ErrorMessage}", profileName, task.Name);
        }
        else
        {
            logger.Info($"Task completed: {task.Name}", profileName, task.Name);
        }

        // A WAIT task already performed its pause as the "execution" itself, so we don't
        // apply a second, generic post-task delay for it here.
        if (task.Type != TaskType.Wait && task.DelaySeconds > 0)
        {
            logger.Info($"Waiting {task.DelaySeconds} seconds", profileName);
            await Task.Delay(TimeSpan.FromSeconds(task.DelaySeconds), cancellationToken);
        }

        return result;
    }
}
