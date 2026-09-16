using System.Text;
using AutomationAgent.Models;
using AutomationAgent.Windows;

namespace AutomationAgent.Executors;

public class ChromeExecutor : ITaskExecutor
{
    public Task<TaskExecutionOutcome> ExecuteAsync(AutomationTask task, CancellationToken cancellationToken)
    {
        var config = task.Configuration;

        if (!string.IsNullOrWhiteSpace(config.Url) && !UrlValidation.IsValidHttpUrl(config.Url))
        {
            return Task.FromResult(TaskExecutionOutcome.Failed(
                "Could not open Chrome. The configured URL must be a valid http:// or https:// address."));
        }

        var chromePath = !string.IsNullOrWhiteSpace(config.ChromeExecutablePath) && File.Exists(config.ChromeExecutablePath)
            ? config.ChromeExecutablePath
            : BrowserLocator.FindChrome();

        if (chromePath is null)
        {
            return Task.FromResult(TaskExecutionOutcome.Failed(
                "Could not open Chrome. Google Chrome is not installed in its usual location - set the executable path in the task."));
        }

        var arguments = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(config.ChromeProfileDirectory))
        {
            arguments.Append($"--profile-directory=\"{config.ChromeProfileDirectory}\" ");
        }
        if (!string.IsNullOrWhiteSpace(config.Url))
        {
            arguments.Append($"\"{config.Url}\"");
        }

        var outcome = ProcessLauncher.Start(chromePath, arguments.ToString().Trim(), "Could not open Chrome.");
        return Task.FromResult(outcome);
    }
}
