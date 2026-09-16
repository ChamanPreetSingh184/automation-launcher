using AutomationAgent.Models;

namespace AutomationAgent.Executors;

/// <summary>
/// A WAIT task's entire job is to pause. It reuses AutomationTask.DelaySeconds
/// as its duration, so TaskRunner does not additionally apply the normal
/// post-task delay after a WAIT task (that would double the pause).
/// </summary>
public class WaitExecutor : ITaskExecutor
{
    public async Task<TaskExecutionOutcome> ExecuteAsync(AutomationTask task, CancellationToken cancellationToken)
    {
        if (task.DelaySeconds > 0)
        {
            await Task.Delay(TimeSpan.FromSeconds(task.DelaySeconds), cancellationToken);
        }

        return TaskExecutionOutcome.Completed();
    }
}
