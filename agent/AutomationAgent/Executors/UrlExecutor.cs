using AutomationAgent.Models;

namespace AutomationAgent.Executors;

public class UrlExecutor : ITaskExecutor
{
    public Task<TaskExecutionOutcome> ExecuteAsync(AutomationTask task, CancellationToken cancellationToken)
    {
        var url = task.Configuration.Url;
        if (!UrlValidation.IsValidHttpUrl(url))
        {
            return Task.FromResult(TaskExecutionOutcome.Failed(
                "Could not open the URL. It must be a valid http:// or https:// address."));
        }

        var outcome = ProcessLauncher.Start(url!, null, "Could not open the URL.");
        return Task.FromResult(outcome);
    }
}
