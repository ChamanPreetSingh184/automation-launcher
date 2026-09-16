using AutomationAgent.Models;
using AutomationAgent.Windows;

namespace AutomationAgent.Executors;

public class EdgeExecutor : ITaskExecutor
{
    public Task<TaskExecutionOutcome> ExecuteAsync(AutomationTask task, CancellationToken cancellationToken)
    {
        var config = task.Configuration;

        if (!UrlValidation.IsValidHttpUrl(config.Url))
        {
            return Task.FromResult(TaskExecutionOutcome.Failed(
                "Could not open Microsoft Edge. The configured URL must be a valid http:// or https:// address."));
        }

        var edgePath = !string.IsNullOrWhiteSpace(config.EdgeExecutablePath) && File.Exists(config.EdgeExecutablePath)
            ? config.EdgeExecutablePath
            : BrowserLocator.FindEdge();

        if (edgePath is null)
        {
            return Task.FromResult(TaskExecutionOutcome.Failed(
                "Could not open Microsoft Edge. It is not installed in its usual location - set the executable path in the task."));
        }

        var outcome = ProcessLauncher.Start(edgePath, $"\"{config.Url}\"", "Could not open Microsoft Edge.");
        return Task.FromResult(outcome);
    }
}
